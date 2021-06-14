import { Minimatch } from "minimatch";
import * as vscode from "vscode";

import { readRequest, writeResponse } from "./io";
import { any } from "./regex";

export default class CommandRunner {
  allowRegex!: RegExp;
  denyRegex!: RegExp | null;

  constructor() {
    this.reloadConfiguration = this.reloadConfiguration.bind(this);
    this.runCommand = this.runCommand.bind(this);

    this.reloadConfiguration();
    vscode.workspace.onDidChangeConfiguration(this.reloadConfiguration);
  }

  reloadConfiguration() {
    const allowList = vscode.workspace
      .getConfiguration("command-server")
      .get<string[]>("allowList")!;

    this.allowRegex = any(
      ...allowList.map((glob) => new Minimatch(glob).makeRe())
    );

    const denyList = vscode.workspace
      .getConfiguration("command-server")
      .get<string[]>("denyList")!;

    this.denyRegex =
      denyList.length === 0
        ? null
        : any(...denyList.map((glob) => new Minimatch(glob).makeRe()));
  }

  /**
   * Reads a command from the request file and executes it.  Writes information
   * about command execution to the result of the command to the response file,
   * If requested, will wait for command to finish, and can also write command
   * output to response file.  See also documentation for Request / Response
   * types.
   */
  async runCommand() {
    const { commandId, args, uuid, returnCommandOutput, waitForFinish } =
      await readRequest();

    try {
      if (!vscode.window.state.focused) {
        throw new Error("This editor is not active");
      }

      if (!commandId.match(this.allowRegex)) {
        throw new Error("Command not in allowList");
      }

      if (this.denyRegex != null && commandId.match(this.denyRegex)) {
        throw new Error("Command in denyList");
      }

      const commandPromise = vscode.commands.executeCommand(commandId, ...args);

      var commandReturnValue = null;

      if (returnCommandOutput) {
        commandReturnValue = await commandPromise;
      } else if (waitForFinish) {
        await commandPromise;
      }

      await writeResponse({
        error: null,
        uuid,
        returnValue: commandReturnValue,
      });
    } catch (err) {
      await writeResponse({
        error: err.message,
        uuid,
      });
    }
  }
}

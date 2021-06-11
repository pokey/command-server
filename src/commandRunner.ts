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
   * Reads a command from the request file and executes it.  Writes the result of
   * the command to the response file, if requested.
   */
  async runCommand() {
    const { commandId, args, uuid, returnCommandOutput, waitForFinish } =
      await readRequest();

    if (!vscode.window.state.focused) {
      await writeResponse({
        error: "This editor is not active",
        uuid,
      });

      return;
    }

    if (!commandId.match(this.allowRegex)) {
      await writeResponse({
        error: "Command not in allowList",
        uuid,
      });

      return;
    }

    if (this.denyRegex != null && commandId.match(this.denyRegex)) {
      await writeResponse({
        error: "Command in denyList",
        uuid,
      });

      return;
    }

    try {
      const commandPromise = vscode.commands.executeCommand(commandId, ...args);

      var commandReturnValue = null;

      if (returnCommandOutput) {
        commandReturnValue = await commandPromise;
      } else if (waitForFinish) {
        await commandPromise;
      }

      await writeResponse({
        error: null,
        uuid: uuid,
        returnValue: commandReturnValue,
      });
    } catch (err) {
      await writeResponse({
        error: err.message,
        uuid: uuid,
      });
    }
  }
}

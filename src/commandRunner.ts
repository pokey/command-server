import { open } from "fs/promises";
import { Minimatch } from "minimatch";
import * as vscode from "vscode";

import { readRequest, writeResponse } from "./io";
import { getResponsePath } from "./paths";
import { any } from "./regex";
import { Request } from "./types";

export default class CommandRunner {
  allowRegex!: RegExp;
  denyRegex!: RegExp | null;
  backgroundWindowProtection!: boolean;

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

    this.backgroundWindowProtection = vscode.workspace
      .getConfiguration("command-server")
      .get<boolean>("backgroundWindowProtection")!;
  }

  /**
   * Reads a command from the request file and executes it.  Writes information
   * about command execution to the result of the command to the response file,
   * If requested, will wait for command to finish, and can also write command
   * output to response file.  See also documentation for Request / Response
   * types.
   */
  async runCommand() {
    const responseFile = await open(getResponsePath(), "wx");

    let request: Request;

    try {
      request = await readRequest();
    } catch (err) {
      await responseFile.close();
      throw err;
    }

    const { commandId, args, uuid, returnCommandOutput, waitForFinish } =
      request;

    const warnings = [];

    try {
      if (!vscode.window.state.focused) {
        if (this.backgroundWindowProtection) {
          throw new Error("This editor is not active");
        } else {
          warnings.push("This editor is not active");
        }
      }

      if (!commandId.match(this.allowRegex)) {
        throw new Error("Command not in allowList");
      }

      if (this.denyRegex != null && commandId.match(this.denyRegex)) {
        throw new Error("Command in denyList");
      }

      const commandPromise = vscode.commands.executeCommand(commandId, ...args);

      let commandReturnValue = null;

      if (returnCommandOutput) {
        commandReturnValue = await commandPromise;
      } else if (waitForFinish) {
        await commandPromise;
      }

      await writeResponse(responseFile, {
        error: null,
        uuid,
        returnValue: commandReturnValue,
        warnings,
      });
    } catch (err: any) {
      await writeResponse(responseFile, {
        error: err.message,
        uuid,
        warnings,
      });
    }

    await responseFile.close();
  }
}

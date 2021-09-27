import * as vscode from "vscode";

import { initializeCommunicationDir } from "./initializeCommunicationDir";
import CommandRunner from "./commandRunner";
import GlobalState from "./globalState";

interface Api {
  globalState: vscode.Memento;
}

export function activate(context: vscode.ExtensionContext) {
  initializeCommunicationDir();

  const commandRunner = new CommandRunner();

  const globalState = new GlobalState();
  globalState.init();

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "command-server.runCommand",
      commandRunner.runCommand
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "command-server.updateState.terminal.false",
      commandRunner.runCommand
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "command-server.updateState.terminal.true",
      () => {
        globalState.update("terminalFocus", true);
        stateUpdater.updateState();
      }
    )
  );

  const api: Api = {
    globalState,
  };

  return api;
}

// this method is called when your extension is deactivated
export function deactivate() {}

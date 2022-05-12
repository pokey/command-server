import * as vscode from "vscode";

import { initializeCommunicationDir } from "./initializeCommunicationDir";
import CommandRunner from "./commandRunner";
import { getInboundSignal } from "./signal";

export function activate(context: vscode.ExtensionContext) {
  initializeCommunicationDir();

  const commandRunner = new CommandRunner();

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "command-server.runCommand",
      commandRunner.runCommand
    ),
    vscode.commands.registerCommand(
      "command-server.getSetting",
      (section: string, defaultValue?: any) =>
        vscode.workspace.getConfiguration().get(section, defaultValue)
    ),
    vscode.commands.registerCommand(
      "command-server.setSetting",
      (section: string, value: any) =>
        vscode.workspace.getConfiguration().update(section, value, true)
    )
  );

  return {
    /**
     * These signals can be used as a form of IPC to indicate that an event has
     * occurred.
     */
    signals: {
      /**
       * This signal is emitted by the voice engine to indicate that a phrase has
       * just begun execution.
       */
      prePhrase: getInboundSignal("prePhrase"),
    },
  };
}

// this method is called when your extension is deactivated
export function deactivate() {}

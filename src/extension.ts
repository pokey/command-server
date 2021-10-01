import * as vscode from "vscode";

import { initializeCommunicationDir } from "./initializeCommunicationDir";
import CommandRunner from "./commandRunner";
import State from "./state";
import StateSaver from "./stateSaver";
import { setBuiltinState, updateTerminalState } from "./setBuiltinState";

interface Api {
  globalState: vscode.Memento;
  workspaceState: vscode.Memento;
}

export function activate(context: vscode.ExtensionContext) {
  initializeCommunicationDir();

  const commandRunner = new CommandRunner();

  const globalState = new State(context.globalState);
  const workspaceState = new State(context.workspaceState);
  const stateSaver = new StateSaver(globalState, workspaceState);
  stateSaver.init();

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "command-server.runCommand",
      commandRunner.runCommand
    ),
    vscode.commands.registerCommand(
      "command-server.saveState",
      async (extraState: Record<string, unknown>) => {
        for (const [key, value] of Object.entries(extraState)) {
          await workspaceState.update(key, value);
        }

        await setBuiltinState(workspaceState, globalState);

        await stateSaver.save();
      }
    )
  );

  function updateTerminals() {
    updateTerminalState(workspaceState, globalState);
  }

  context.subscriptions.push(
    vscode.window.onDidOpenTerminal(updateTerminals),
    vscode.window.onDidCloseTerminal(updateTerminals),
    vscode.window.onDidChangeActiveTerminal(updateTerminals)
    //   vscode.window.onDidChangeVisibleTextEditors(updateVisibleEditors),
    //   vscode.workspace.onDidChangeTextDocument(updateVisibleEditors),
    //   vscode.workspace.onDidCloseTextDocument(updateDocuments),
    //   vscode.workspace.onDidOpenTextDocument(updateDocuments)
  );

  const api: Api = {
    workspaceState,
    globalState,
  };

  return api;
}

// this method is called when your extension is deactivated
export function deactivate() {}

import * as vscode from "vscode";

import { initializeCommunicationDir } from "./initializeCommunicationDir";
import CommandRunner from "./commandRunner";
import State from "./state";
import { updateCoreState, updateTerminalState } from "./updateCoreState";
import StateUpdateSignaler from "./stateUpdateSignaler";
import SignallingState from "./signallingState";

interface Api {
  globalState: vscode.Memento;
  workspaceState: vscode.Memento;
}

interface KeyDescription {
  key: string;
}

export function activate(context: vscode.ExtensionContext) {
  initializeCommunicationDir();

  const commandRunner = new CommandRunner();

  const stateUpdateSignaler = new StateUpdateSignaler();
  const globalState = new State(context.globalState);
  const workspaceState = new State(context.workspaceState);

  let stateUpdaterPromise: Promise<void> | null = null;

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "command-server.runCommand",
      commandRunner.runCommand
    ),
    vscode.commands.registerCommand(
      "command-server.updateCoreState",
      async (extraState: Record<string, unknown>) => {
        stateUpdaterPromise = (async () => {
          for (const [key, value] of Object.entries(extraState)) {
            await workspaceState.update(key, value);
          }

          await updateCoreState(workspaceState, globalState);
        })();

        await stateUpdaterPromise;

        stateUpdaterPromise = null;
      }
    ),
    vscode.commands.registerCommand(
      "command-server.getState",
      async (keys: KeyDescription[]) => {
        if (stateUpdaterPromise != null) {
          await stateUpdaterPromise;
        }

        return Object.fromEntries(
          keys.map(({ key }) => [
            key,
            {
              newValue:
                workspaceState.get(key, null) ?? globalState.get(key, null),
            },
          ])
        );
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

  // NB: we only signal if externals update; we don't bother for our own
  // updates because update will shortly be requested
  const api: Api = {
    workspaceState: new SignallingState(
      workspaceState,
      stateUpdateSignaler.signalStateUpdated
    ),
    globalState: new SignallingState(
      globalState,
      stateUpdateSignaler.signalStateUpdated
    ),
  };

  return api;
}

// this method is called when your extension is deactivated
export function deactivate() {}

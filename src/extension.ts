import * as vscode from "vscode";

import { NativeAdapter } from "./nativeAdapter";
import CommandRunner from "./commandRunner";
import { FocusedElementType } from "./types";

export async function activate(context: vscode.ExtensionContext) {
  const runtimeAdapter = new NativeAdapter();
  await runtimeAdapter.initialize();

  const commandRunner = new CommandRunner(runtimeAdapter);
  let focusedElementType: FocusedElementType | undefined;

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "command-server.runCommand",
      (focusedElementType_?: FocusedElementType) => {
        focusedElementType = focusedElementType_;
        return commandRunner.runCommand();
      }
    ),
    vscode.commands.registerCommand(
      "command-server.getFocusedElementType",
      () => focusedElementType ?? null
    )
  );

  return {
    /**
     * The type of the focused element in vscode at the moment of the command being executed.
     */
    getFocusedElementType: () => focusedElementType,

    /**
     * These signals can be used as a form of IPC to indicate that an event has
     * occurred.
     */
    signals: {
      /**
       * This signal is emitted by the voice engine to indicate that a phrase has
       * just begun execution.
       */
      prePhrase: runtimeAdapter.getInboundSignal("prePhrase"),
    },
  };
}

// this method is called when your extension is deactivated
export function deactivate() {}

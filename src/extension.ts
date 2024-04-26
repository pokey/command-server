import * as vscode from "vscode";

import { NativeIo } from "./nativeIo";
import CommandRunner from "./commandRunner";
import { FocusedElementType } from "./types";

export async function activate(context: vscode.ExtensionContext) {
  const io = new NativeIo();
  await io.initialize();

  const commandRunner = new CommandRunner(io);
  let focusedElementType: FocusedElementType | undefined;

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "command-server.runCommand",
      async (focusedElementType_: FocusedElementType) => {
        focusedElementType = focusedElementType_;
        await commandRunner.runCommand();
        focusedElementType = undefined;
      }
    ),
    vscode.commands.registerCommand(
      "command-server.getFocusedElementType",
      () => focusedElementType
    )
  );

  return {
    /**
     * The type of the focused element in vscode at the moment of the command being executed.
     */
    getFocusedElementType: async () => focusedElementType,

    /**
     * These signals can be used as a form of IPC to indicate that an event has
     * occurred.
     */
    signals: {
      /**
       * This signal is emitted by the voice engine to indicate that a phrase has
       * just begun execution.
       */
      prePhrase: io.getInboundSignal("prePhrase"),
    },
  };
}

// this method is called when your extension is deactivated
export function deactivate() {}

import * as vscode from "vscode";
import CommandRunner from "./commandRunner";
import { getCommunicationDirPath } from "./paths";
import { FileSystemNode, RpcServerFs } from "./rpcServer";
import type { VscodeCommandPayload } from "./types";
import { FocusedElementType } from "./types";

export async function activate(context: vscode.ExtensionContext) {
    const fileSystem = new FileSystemNode(getCommunicationDirPath());
    const rpc = new RpcServerFs<VscodeCommandPayload>(fileSystem);
    const commandRunner = new CommandRunner(rpc);
    let focusedElementType: FocusedElementType | undefined;

    await fileSystem.initialize();

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
            prePhrase: rpc.getInboundSignal("prePhrase"),
        },
    };
}

// this method is called when your extension is deactivated
export function deactivate() {}

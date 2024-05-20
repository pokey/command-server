import { Minimatch } from "minimatch";
import * as vscode from "vscode";
import { getCommunicationDirPath } from "./paths";
import { any } from "./regex";

import type { RequestCallbackOptions, RpcServer } from "./rpcServer/types";
import type { VscodeCommandPayload } from "./types";
import { RpcServerFs } from "./rpcServer";

export default class CommandRunner {
    private allowRegex!: RegExp;
    private denyRegex!: RegExp | null;
    private backgroundWindowProtection!: boolean;

    constructor(private rpc: RpcServer<VscodeCommandPayload>) {
        this.reloadConfiguration = this.reloadConfiguration.bind(this);
        this.runCommand = this.runCommand.bind(this);
        this.executeRequest = this.executeRequest.bind(this);

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
    runCommand(): Promise<void> {
        return this.rpc.executeRequest(this.executeRequest);
    }

    private async executeRequest(
        { commandId, args }: VscodeCommandPayload,
        options: RequestCallbackOptions
    ) {
        if (!vscode.window.state.focused) {
            if (this.backgroundWindowProtection) {
                throw new Error("This editor is not active");
            } else {
                options.warn("This editor is not active");
            }
        }

        if (!commandId.match(this.allowRegex)) {
            throw new Error("Command not in allowList");
        }

        if (this.denyRegex != null && commandId.match(this.denyRegex)) {
            throw new Error("Command in denyList");
        }

        return vscode.commands.executeCommand(commandId, ...args);
    }
}

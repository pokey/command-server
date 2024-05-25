import * as rpcServer from "./rpcServer";

export function getCommunicationDirPath(): string {
    return rpcServer.getCommunicationDirPath("vscode-command-server");
}

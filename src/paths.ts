import { join } from "path";
import * as rpcServer from "./rpcServer";

const comDir = rpcServer.getCommunicationDirPath("vscode-command-server");
const signalDir = join(comDir, "signals");

export function getCommunicationDirPath(): string {
    return comDir;
}

export function getSignalDirPath(): string {
    return signalDir;
}

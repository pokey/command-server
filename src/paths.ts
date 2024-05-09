import { join } from "path";
import { calculateCommunicationDirPath } from "./rpcServer";

const comDir = calculateCommunicationDirPath("vscode-command-server");
const signalDir = join(comDir, "signals");

export function getCommunicationDirPath(): string {
    return comDir;
}

export function getSignalDirPath(): string {
    return signalDir;
}

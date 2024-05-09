import { join } from "path";
import { getCommunicationDirPath } from "./rpcServer";

const signalDir = join(getCommunicationDirPath(), "signals");

export function getSignalDirPath(): string {
    return signalDir;
}

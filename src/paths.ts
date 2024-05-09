import { tmpdir, userInfo } from "os";
import { join } from "path";

const comDir = (() => {
    const info = userInfo();

    // NB: On Windows, uid < 0, and the tmpdir is user-specific, so we don't
    // bother with a suffix
    const suffix = info.uid >= 0 ? `-${info.uid}` : "";

    return join(tmpdir(), `vscode-command-server${suffix}`);
})();

const signalDir = join(comDir, "signals");

export function getCommunicationDirPath() {
    return comDir;
}

export function getSignalDirPath(): string {
    return signalDir;
}

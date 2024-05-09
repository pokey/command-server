import { tmpdir, userInfo } from "os";
import * as path from "path";

const comDir = (() => {
    const info = userInfo();

    // NB: On Windows, uid < 0, and the tmpdir is user-specific, so we don't
    // bother with a suffix
    const suffix = info.uid >= 0 ? `-${info.uid}` : "";

    return path.join(tmpdir(), `vscode-command-server${suffix}`);
})();

export function getCommunicationDirPath() {
    return comDir;
}

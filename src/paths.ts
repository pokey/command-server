import { tmpdir, userInfo, homedir } from "os";
import { join } from "path";

export function getCommunicationDirPath() {
  const info = userInfo();

  // NB: On Windows, uid < 0, and the tmpdir is user-specific, so we don't
  // bother with a suffix
  const suffix = info.uid >= 0 ? `-${info.uid}` : "";

  // NB: See https://github.com/talonhub/community/issues/966 for why we do
  // per-os directories
  if (process.platform === "win32") {
    return join(`${homedir()}\\AppData\\Roaming\\talon\\`, `vscode-command-server${suffix}`);
  }
  else if (process.platform === "darwin" || process.platform === "linux") {
    return join("/tmp/", `vscode-command-server${suffix}`);
  }
  else {
    return join(tmpdir(), `vscode-command-server${suffix}`);
  }
}

export function getSignalDirPath(): string {
  return join(getCommunicationDirPath(), "signals");
}

export function getRequestPath() {
  return join(getCommunicationDirPath(), "request.json");
}

export function getResponsePath() {
  return join(getCommunicationDirPath(), "response.json");
}

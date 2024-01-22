import { tmpdir, userInfo, homedir } from "os";
import { join } from "path";

export function getDeprecatedCommunicationDirPath() {
  const info = userInfo();

  // NB: On Windows, uid < 0, and the tmpdir is user-specific, so we don't
  // bother with a suffix
  const suffix = info.uid >= 0 ? `-${info.uid}` : "";

  return join(tmpdir(), `vscode-command-server${suffix}`);
}

export function getCommunicationDirPath() {

  // NB: See https://github.com/talonhub/community/issues/966 for why we do
  // per-os directories
  if (process.platform === "win32") {
    return join(`${homedir()}\\AppData\\Roaming\\talon\\.comms\\`, `vscode-command-server}`);
  }
  else if (process.platform === "darwin" || process.platform === "linux") {
    return join(homedir(), `/.talon/.comms/vscode-command-server`);
  }
  else {
    throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

export function getSignalDirPath(): string {
  return join(getCommunicationDirPath(), "signals");
}

export function getDeprecatedSignalDirPath(): string {
  return join(getDeprecatedCommunicationDirPath(), "signals");
}

export function getRequestPath() {
  return join(getCommunicationDirPath(), "request.json");
}

export function getDeprecatedRequestPath() {
  return join(getDeprecatedCommunicationDirPath(), "request.json");
}

export function getResponsePath(isDeprecatedClient: boolean) {
  if (isDeprecatedClient) {
    return join(getDeprecatedCommunicationDirPath(), "response.json");
  }
  return join(getCommunicationDirPath(), "response.json");
}

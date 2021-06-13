import { tmpdir, userInfo } from "os";
import { join } from "path";

export function getCommunicationDirPath() {
  const info = userInfo();

  // NB: On Windows, uid < 0, and the tmpdir is user-specific, so we don't
  // bother with a suffix
  const suffix = info.uid >= 0 ? `-${info.uid}` : "";

  return join(tmpdir(), `vscode-command-server${suffix}`);
}

export function getRequestPath() {
  const communicationDirPath = getCommunicationDirPath();

  return join(communicationDirPath, "request.json");
}

export function getResponsePath() {
  const communicationDirPath = getCommunicationDirPath();

  return join(communicationDirPath, "response.json");
}

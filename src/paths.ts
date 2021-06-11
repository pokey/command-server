import { tmpdir, userInfo } from "os";
import { join } from "path";

export function getCommunicationDirPath() {
  const userName = userInfo().username;
  return join(tmpdir(), `vscode-command-server-${userName}`);
}

export function getRequestPath() {
  const communicationDirPath = getCommunicationDirPath();

  return join(communicationDirPath, "request.json");
}

export function getResponsePath() {
  const communicationDirPath = getCommunicationDirPath();

  return join(communicationDirPath, "response.json");
}

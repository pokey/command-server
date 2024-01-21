import { homedir } from "os";
import { join } from "path";

export function getCommunicationDirPath() {

  // NB: See https://github.com/talonhub/community/issues/966 for why we do
  // per-os directories
  if (process.platform === "win32") {
    return join(`${homedir()}\\AppData\\Roaming\\talon\\`, `vscode-command-server}`);
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

export function getRequestPath() {
  return join(getCommunicationDirPath(), "request.json");
}

export function getResponsePath() {
  return join(getCommunicationDirPath(), "response.json");
}

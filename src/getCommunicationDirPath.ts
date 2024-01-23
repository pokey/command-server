import { homedir } from "os";
import { join } from "path";

function getTalonDir(): string {
  if (process.platform === "win32") {
    return join(homedir(), "AppData", "Roaming", "talon");
  } else if (process.platform === "darwin" || process.platform === "linux") {
    return join(homedir(), ".talon");
  } else {
    throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

export function getCommunicationDirPath() {
  // NB: See https://github.com/talonhub/community/issues/966 for lots of
  // discussion about this path
  return join(getTalonDir(), ".comms", "vscode-command-server");
}

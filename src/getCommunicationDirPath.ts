import { homedir } from "os";
import { join } from "path";

export function getCommunicationDirPath() {
  // NB: See https://github.com/talonhub/community/issues/966 for lots of
  // discussion about this path
  if (process.platform === "linux" || process.platform === "darwin") {
    return join(homedir(), ".talon/.comms/vscode-command-server");
  } else if (process.platform === "win32") {
    return join(
      homedir(),
      "\\AppData\\Roaming\\talon\\.comms\\vscode-command-server"
    );
  } else {
    throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

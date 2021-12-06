import { stat } from "fs/promises";
import { join } from "path";
import { getSignalDirPath } from "./paths";

class InboundSignal {
  constructor(private path: string) {}

  /**
   * Gets the current version of the signal. This version string changes every
   * time the signal is emitted, and can be used to detect whether signal has
   * been emitted between two timepoints.
   * @returns The current signal version or null if the signal file could not be
   * found
   */
  async getVersion() {
    try {
      return (await stat(this.path)).mtimeMs.toString();
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }

      return null;
    }
  }
}

export function getInboundSignal(name: string) {
  const signalDir = getSignalDirPath();
  const path = join(signalDir, name);

  return new InboundSignal(path);
}

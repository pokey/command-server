import { mkdirSync, lstatSync } from "fs";
import { join } from "path";
import { S_IWOTH } from "constants";
import {
  getCommunicationDirPath,
  getRequestPath,
  getResponsePath,
  getSignalDirPath,
} from "./paths";
import { userInfo } from "os";
import { Io } from "./io";
import { FileHandle, open, readFile, stat } from "fs/promises";
import { VSCODE_COMMAND_TIMEOUT_MS } from "./constants";
import { Request, Response } from "./types";

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

export class NativeIo implements Io {
  private responseFile: FileHandle | null;

  constructor() {
    this.responseFile = null;
  }

  initialize(): Promise<void> {
    const communicationDirPath = getCommunicationDirPath();

    console.debug(`Creating communication dir ${communicationDirPath}`);
    mkdirSync(communicationDirPath, { recursive: true, mode: 0o770 });

    const stats = lstatSync(communicationDirPath);

    const info = userInfo();

    if (
      !stats.isDirectory() ||
      stats.isSymbolicLink() ||
      stats.mode & S_IWOTH ||
      // On Windows, uid < 0, so we don't worry about it for simplicity
      (info.uid >= 0 && stats.uid !== info.uid)
    ) {
      throw new Error(
        `Refusing to proceed because of invalid communication dir ${communicationDirPath}`
      );
    }
  }

  async prepareResponse(): Promise<void> {
    if (this.responseFile) {
      throw new Error("response is already locked");
    }
    this.responseFile = await open(getResponsePath(), "wx");
  }

  async closeResponse(): Promise<void> {
    if (!this.responseFile) {
      throw new Error("response is not locked");
    }
    return this.responseFile.close();
  }

  /**
   * Reads the JSON-encoded request from the request file, unlinking the file
   * after reading.
   * @returns A promise that resolves to a Response object
   */
  async readRequest(): Promise<Request> {
    const requestPath = getRequestPath();

    const stats = await stat(requestPath);
    const request = JSON.parse(await readFile(requestPath, "utf-8"));

    if (
      Math.abs(stats.mtimeMs - new Date().getTime()) > VSCODE_COMMAND_TIMEOUT_MS
    ) {
      throw new Error(
        "Request file is older than timeout; refusing to execute command"
      );
    }

    return request;
  }

  /**
   * Writes the response to the response file as JSON.
   * @param file The file to write to
   * @param response The response object to JSON-encode and write to disk
   */
  async writeResponse(response: Response) {
    if (!this.responseFile) {
      throw new Error("response is not locked");
    }
    await this.responseFile.write(`${JSON.stringify(response)}\n`);
  }

  getInboundSignal(name: string) {
    const signalDir = getSignalDirPath();
    const path = join(signalDir, name);
    return new InboundSignal(path);
  }
}

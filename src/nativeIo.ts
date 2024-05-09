import { S_IWOTH } from "constants";
import { lstatSync, mkdirSync } from "fs";
import { FileHandle, open, readFile, stat } from "fs/promises";
import { userInfo } from "os";
import { join } from "path";
import { VSCODE_COMMAND_TIMEOUT_MS } from "./constants";
import { Io } from "./io";
import { Request, Response } from "./types";

const MAX_SIGNAL_VERSION_AGE_MS = 60 * 1000;

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
      const { mtimeMs } = await stat(this.path);

      if (
        Math.abs(mtimeMs - new Date().getTime()) > MAX_SIGNAL_VERSION_AGE_MS
      ) {
        return null;
      }

      return mtimeMs.toString();
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
  private signalDirPath: string;
  private requestPath: string;
  private responsePath: string;

  constructor(private communicationDirPath: string) {
    this.responseFile = null;

    this.signalDirPath = join(communicationDirPath, "signals");
    this.requestPath = join(communicationDirPath, "request.json");
    this.responsePath = join(communicationDirPath, "response.json");
  }

  async initialize(): Promise<void> {
    console.debug(`Creating communication dir ${this.communicationDirPath}`);
    mkdirSync(this.communicationDirPath, { recursive: true, mode: 0o770 });

    const stats = lstatSync(this.communicationDirPath);

    const info = userInfo();

    if (
      !stats.isDirectory() ||
      stats.isSymbolicLink() ||
      stats.mode & S_IWOTH ||
      // On Windows, uid < 0, so we don't worry about it for simplicity
      (info.uid >= 0 && stats.uid !== info.uid)
    ) {
      throw new Error(
        `Refusing to proceed because of invalid communication dir ${this.communicationDirPath}`
      );
    }
  }

  async prepareResponse(): Promise<void> {
    if (this.responseFile) {
      throw new Error("response is already locked");
    }
    this.responseFile = await open(this.responsePath, "wx");
  }

  async closeResponse(): Promise<void> {
    if (!this.responseFile) {
      throw new Error("response is not locked");
    }
    await this.responseFile.close();
    this.responseFile = null;
  }

  /**
   * Reads the JSON-encoded request from the request file
   * @returns A promise that resolves to a Response object
   */
  async readRequest(): Promise<Request> {
    const stats = await stat(this.requestPath);
    const request = JSON.parse(await readFile(this.requestPath, "utf-8"));

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
    const signalDir = this.signalDirPath;
    const path = join(signalDir, name);
    return new InboundSignal(path);
  }
}

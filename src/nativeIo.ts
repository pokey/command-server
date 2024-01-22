import { mkdirSync, lstatSync } from "fs";
import { join } from "path";
import { S_IWOTH } from "constants";
import {
  getCommunicationDirPath,
  getDeprecatedCommunicationDirPath,
  getRequestPath,
  getDeprecatedRequestPath,
  getResponsePath,
  getSignalDirPath,
  getDeprecatedSignalDirPath,
} from "./paths";
import { userInfo } from "os";
import { Io } from "./io";
import { FileHandle, open, readFile, stat } from "fs/promises";
import { VSCODE_COMMAND_TIMEOUT_MS } from "./constants";
import { Request, Response } from "./types";

class InboundSignal {
  constructor(private oldPath: string, private newPath: string) {}

  /**
   * Gets the current version of the signal. This version string changes every
   * time the signal is emitted, and can be used to detect whether signal has
   * been emitted between two timepoints.
   * @returns The current signal version or null if the signal file could not be
   * found
   */
  async getVersion() {
    try {
      return (await stat(this.newPath)).mtimeMs.toString();
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }
    try {
      return (await stat(this.oldPath)).mtimeMs.toString();
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }
    return null;
  }
}

export class NativeIo implements Io {
  private responseFile: FileHandle | null;
  private isDeprecatedClient: boolean;

  constructor() {
    this.responseFile = null;
    this.isDeprecatedClient = false;
  }

  async initializeFolder(dirPath: string): Promise<void> {

    console.debug(
      `Creating deprecated communication dir ${dirPath}`
    );
    mkdirSync(dirPath, { recursive: true, mode: 0o770 });

    const stats = lstatSync(dirPath);
    const info = userInfo();

    if (
      !stats.isDirectory() ||
      stats.isSymbolicLink() ||
      stats.mode & S_IWOTH ||
      // On Windows, uid < 0, so we don't worry about it for simplicity
      (info.uid >= 0 && stats.uid !== info.uid)
    ) {
      throw new Error(
        `Refusing to proceed because of invalid communication dir ${dirPath}`
      );
    }
  }

  async initialize(): Promise<void> {
    const communicationDirPath = getCommunicationDirPath();
    this.initializeFolder(communicationDirPath);
    const deprecatedCommunicationDirPath = getDeprecatedCommunicationDirPath();
    this.initializeFolder(deprecatedCommunicationDirPath);
  }

  async prepareResponse(): Promise<void> {
    if (this.responseFile) {
      throw new Error("response is already locked");
    }
    this.responseFile = await open(getResponsePath(this.isDeprecatedClient), "wx");
  }

  async closeResponse(): Promise<void> {
    if (!this.responseFile) {
      throw new Error("response is not locked");
    }
    await this.responseFile.close();
    this.responseFile = null;
  }

  /**
   * Reads the JSON-encoded request from the request file, unlinking the file
   * after reading.
   * @returns A promise that resolves to a Response object
   */
  async readRequest(): Promise<Request> {
    var requestPath = getRequestPath();
    var stats;
    try {
      stats = await stat(requestPath);
      this.isDeprecatedClient = false;
    }
    catch (err) {
      requestPath = getDeprecatedRequestPath();
      stats = await stat(requestPath);
      this.isDeprecatedClient = true;
    }

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
    var signalDir = getSignalDirPath();
    const newPath = join(signalDir, name);
    signalDir = getDeprecatedSignalDirPath();
    const oldPath = join(signalDir, name);

    return new InboundSignal(newPath, oldPath);
  }
}


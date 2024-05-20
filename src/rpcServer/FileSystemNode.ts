import { S_IWOTH } from "constants";
import * as fs from "fs";
import * as fsPromises from "fs/promises";
import * as os from "os";
import * as path from "path";
import type { FileSystem, Request, Response } from "./types";

// The amount of time that client is expected to wait for the server to perform a
// command, in milliseconds.
export const COMMAND_TIMEOUT_MS = 3000;

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
            return (await fsPromises.stat(this.path)).mtimeMs.toString();
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
                throw err;
            }

            return null;
        }
    }
}

export class FileSystemNode implements FileSystem {
    private requestPath: string;
    private responsePath: string;
    private signalsDirPath: string;
    private responseFile: fsPromises.FileHandle | null;

    constructor(private dirPath: string) {
        this.requestPath = path.join(this.dirPath, "request.json");
        this.responsePath = path.join(this.dirPath, "response.json");
        this.signalsDirPath = path.join(this.dirPath, "signals");
        this.responseFile = null;
    }

    async initialize(): Promise<void> {
        console.debug(`Creating communication dir ${this.dirPath}`);

        fs.mkdirSync(this.dirPath, { recursive: true, mode: 0o770 });

        const stats = fs.lstatSync(this.dirPath);

        const info = os.userInfo();

        if (
            !stats.isDirectory() ||
            stats.isSymbolicLink() ||
            stats.mode & S_IWOTH ||
            // On Windows, uid < 0, so we don't worry about it for simplicity
            (info.uid >= 0 && stats.uid !== info.uid)
        ) {
            throw new Error(
                `Refusing to proceed because of invalid communication dir ${this.dirPath}`
            );
        }
    }

    async prepareResponse(): Promise<void> {
        if (this.responseFile) {
            throw new Error("response is already locked");
        }
        this.responseFile = await fsPromises.open(this.responsePath, "wx");
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
        const stats = await fsPromises.stat(this.requestPath);
        const request = JSON.parse(
            await fsPromises.readFile(this.requestPath, "utf-8")
        );

        if (Math.abs(stats.mtimeMs - Date.now()) > COMMAND_TIMEOUT_MS) {
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
        const signalPath = path.join(this.signalsDirPath, name);
        return new InboundSignal(signalPath);
    }
}

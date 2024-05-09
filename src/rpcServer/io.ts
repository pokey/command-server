import { FileHandle, readFile, stat } from "fs/promises";
import { Request, Response } from "./types";

// The amount of time that client is expected to wait for the server to perform a
// command, in milliseconds.
export const COMMAND_TIMEOUT_MS = 3000;

/**
 * Reads the JSON-encoded request from the request file, unlinking the file
 * after reading.
 * @returns A promise that resolves to a Response object
 */
export async function readRequest(requestPath: string): Promise<Request> {
    const stats = await stat(requestPath);
    const content = await readFile(requestPath, "utf-8");
    const request = JSON.parse(content);

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
export async function writeResponse(file: FileHandle, response: Response) {
    await writeJSON(file, response);
}

/**
 * Writes stringified JSON.
 * Appends newline so that other side knows when it is done
 * @param path Output path
 * @param body Body to stringify and write
 */
async function writeJSON(file: FileHandle, body: any) {
    await file.write(`${JSON.stringify(body)}\n`);
}

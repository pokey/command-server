import { FileHandle, readFile, stat } from "fs/promises";
import { VSCODE_COMMAND_TIMEOUT_MS } from "./constants";
import { getRequestPath } from "./paths";
import { Request, Response } from "./types";
import { writeJSON } from "./fileUtils";

/**
 * Reads the JSON-encoded request from the request file, unlinking the file
 * after reading.
 * @returns A promise that resolves to a Response object
 */
export async function readRequest(): Promise<Request> {
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
export async function writeResponse(file: FileHandle, response: Response) {
  await writeJSON(file, response);
}

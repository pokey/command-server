import { readFile, stat, unlink } from "fs/promises";
import { STALE_TIMEOUT_MS } from "./constants";
import { getRequestPath, getResponsePath } from "./paths";
import { Request, Response } from "./types";
import { writeJSONExclusive } from "./fileUtils";

/**
 * Reads the JSON-encoded request from the request file, unlinking the file
 * after reading.
 * @returns A promise that resolves to a Response object
 */
export async function readRequest(): Promise<Request> {
  const requestPath = getRequestPath();
  const request = JSON.parse(await readFile(requestPath, "utf-8"));
  await unlink(requestPath);

  return request;
}

/**
 * Writes the response to the response file as JSON.  If a stale response file
 * exists, it will be removed.  If a non-stale response file exists, assumes
 * there is another VSCode instance mysteriously trying to handle the request
 * as well and fails.
 * @param response The response object to JSON-encode and write to disk
 */
export async function writeResponse(response: Response) {
  const responsePath = getResponsePath();

  try {
    await writeJSONExclusive(responsePath, response);
  } catch (err) {
    if (err.code !== "EEXIST") {
      throw err;
    }

    try {
      const stats = await stat(responsePath);

      if (Math.abs(stats.mtimeMs - new Date().getTime()) < STALE_TIMEOUT_MS) {
        throw new Error("Another process has an active response file");
      }

      console.log("Removing stale response file");
      await unlink(responsePath);
    } catch (err) {
      // If the file was removed for whatever reason in the interim we just continue
      if (err.code !== "ENOENT") {
        throw err;
      }
    }

    await writeJSONExclusive(responsePath, response);
  }
}

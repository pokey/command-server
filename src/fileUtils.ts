import { FileHandle } from "fs/promises";

/**
 * Writes stringified JSON.
 * Appends newline so that other side knows when it is done
 * @param path Output path
 * @param body Body to stringify and write
 */
export async function writeJSON(file: FileHandle, body: any) {
  await file.write(`${JSON.stringify(body)}\n`);
}

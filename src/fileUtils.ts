import { unlinkSync } from "fs";
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

/**
 * Unlink the given file if it exists, otherwise do nothing
 * @param path The path to unlink
 */
export function unlinkIfExistsSync(path: string) {
  try {
    unlinkSync(path);
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
  }
}

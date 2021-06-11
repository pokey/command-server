import { unlinkSync } from "fs";
import { writeFile } from "fs/promises";

/**
 * Opens a file exclusively, failing if it exists, and writes stringified JSON.
 * Appends newline so that other side knows when it is done
 * @param path Output path
 * @param body Body to stringify and write
 */
export async function writeJSONExclusive(path: string, body: any) {
  await writeFile(path, `${JSON.stringify(body)}\n`, { flag: "wx" });
}

/**
 * Unlike the given file if it exists, otherwise do nothing
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

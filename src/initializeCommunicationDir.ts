import { mkdirSync, lstatSync } from "fs";
import { S_IWOTH } from "constants";
import { getuid } from "process";
import {
  getRequestPath,
  getResponsePath,
  getCommunicationDirPath,
} from "./paths";
import { unlinkIfExistsSync } from "./fileUtils";

export function initializeCommunicationDir() {
  const communicationDirPath = getCommunicationDirPath();

  console.log(`Creating communication dir ${communicationDirPath}`);
  mkdirSync(communicationDirPath, { recursive: true, mode: 0o770 });

  const stats = lstatSync(communicationDirPath);

  if (
    !stats.isDirectory() ||
    stats.isSymbolicLink() ||
    stats.mode & S_IWOTH ||
    stats.uid !== getuid()
  ) {
    throw new Error(
      `Refusing to proceed because of invalid communication dir ${communicationDirPath}`
    );
  }

  unlinkIfExistsSync(getRequestPath());
  unlinkIfExistsSync(getResponsePath());
}

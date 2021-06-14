import { mkdirSync, lstatSync } from "fs";
import { S_IWOTH } from "constants";
import {
  getRequestPath,
  getResponsePath,
  getCommunicationDirPath,
} from "./paths";
import { unlinkIfExistsSync } from "./fileUtils";
import { userInfo } from "os";

export function initializeCommunicationDir() {
  const communicationDirPath = getCommunicationDirPath();

  console.log(`Creating communication dir ${communicationDirPath}`);
  mkdirSync(communicationDirPath, { recursive: true, mode: 0o770 });

  const stats = lstatSync(communicationDirPath);

  const info = userInfo();

  if (
    !stats.isDirectory() ||
    stats.isSymbolicLink() ||
    stats.mode & S_IWOTH ||
    // On Windows, uid < 0, so we don't worry about it for simplicity
    (info.uid >= 0 && stats.uid !== info.uid)
  ) {
    throw new Error(
      `Refusing to proceed because of invalid communication dir ${communicationDirPath}`
    );
  }

  unlinkIfExistsSync(getRequestPath());
  unlinkIfExistsSync(getResponsePath());
}

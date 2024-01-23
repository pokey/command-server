import { getCommunicationDirPath } from "./getCommunicationDirPath";
import { sync as rimrafSync } from "rimraf";

function main() {
  rimrafSync(getCommunicationDirPath(), { disableGlob: true });
}

main();

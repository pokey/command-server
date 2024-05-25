import { sync as rimrafSync } from "rimraf";
import { getCommunicationDirPath } from "./paths";

function main() {
    rimrafSync(getCommunicationDirPath(), { disableGlob: true });
}

main();

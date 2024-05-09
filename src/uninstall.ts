import { sync as rimrafSync } from "rimraf";
import { getCommunicationDirPath } from "./rpcServer";

function main() {
    rimrafSync(getCommunicationDirPath(), { disableGlob: true });
}

main();

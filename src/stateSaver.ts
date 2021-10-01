import { lstatSync, mkdirSync, readFileSync } from "fs";
import { open } from "fs/promises";
import { Memento } from "vscode";
import { writeJSON } from "./fileUtils";
import State from "./state";
import { getGlobalStateDirPath, getWorkspaceStateDirPath } from "./paths";
import { join } from "path";

function writeState(memento: Memento, stateDirPath: string) {
  return memento.keys().map(async (key) => {
    const responseFile = await open(join(stateDirPath, key), "w");

    try {
      await writeJSON(responseFile, memento.get(key));
    } finally {
      await responseFile.close();
    }
  });
}

export default class StateSaver {
  constructor(private globalState: State, private workspaceState: State) {}

  init() {
    mkdirSync(getGlobalStateDirPath(), { recursive: true });
    mkdirSync(getWorkspaceStateDirPath(), { recursive: true });
  }

  async save() {
    const globalStatePromises = writeState(
      this.globalState,
      getGlobalStateDirPath()
    );

    const workspaceStatePromises = writeState(
      this.workspaceState,
      getWorkspaceStateDirPath()
    );

    await Promise.all([...globalStatePromises, ...workspaceStatePromises]);
  }
}

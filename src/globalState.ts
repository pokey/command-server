import { lstatSync, mkdirSync, readFileSync } from "fs";
import { open } from "fs/promises";
import { Memento } from "vscode";
import { writeJSON } from "./fileUtils";
import { getGlobalStatePath } from "./paths";

export default class GlobalState implements Memento {
  state: Record<string, unknown> = {};

  init() {
    mkdirSync(getGlobalStatePath(), { recursive: true });
    this.loadSync();
  }

  loadSync() {
    const statePath = getGlobalStatePath();
    const stats = lstatSync(statePath);

    if (stats.isFile()) {
      this.state = JSON.parse(readFileSync(statePath, "utf-8"));
    }
  }

  async save() {
    const responseFile = await open(getGlobalStatePath(), "w");

    try {
      await writeJSON(responseFile, this.state);
    } finally {
      await responseFile.close();
    }
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    const value = this.state[key];

    return value == null ? defaultValue : (value as T);
  }

  keys(): readonly string[] {
    return Object.keys(this.state);
  }

  async update(key: string, value: any): Promise<void> {
    this.state[key] = value;

    await this.save();
  }
}

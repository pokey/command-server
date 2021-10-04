import { Memento } from "vscode";

const STORAGE_KEY = "pokey.command-server.state";

function getKey(key: string) {
  return `${STORAGE_KEY}.${key}`;
}

export default class State implements Memento {
  constructor(private storage: Memento) {}

  get<T>(key: string, defaultValue?: T): T | undefined {
    return this.storage.get(getKey(key), defaultValue);
  }

  keys(): readonly string[] {
    return this.storage
      .keys()
      .filter((key) => key.startsWith(STORAGE_KEY))
      .map((key) => key.substring(STORAGE_KEY.length + 1));
  }

  async update(key: string, value: any): Promise<void> {
    await this.storage.update(getKey(key), value);
  }
}

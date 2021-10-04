import { Memento } from "vscode";

export default class SignallingState implements Memento {
  constructor(
    private storage: Memento,
    private signalStateUpdated: (key: string) => unknown
  ) {}

  get<T>(key: string, defaultValue?: T): T | undefined {
    return this.storage.get(key, defaultValue);
  }

  keys(): readonly string[] {
    return this.storage.keys();
  }

  async update(key: string, value: any): Promise<void> {
    await this.storage.update(key, value);
    this.signalStateUpdated(key);
  }
}

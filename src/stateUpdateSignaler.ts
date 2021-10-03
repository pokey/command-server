import { getStateUpdatedSignalPath } from "./paths";
import touch from "./touch";

export default class StateUpdateSignaler {
  constructor() {
    this.signalStateUpdated = this.signalStateUpdated.bind(this);
  }

  async signalStateUpdated(key: string) {
    await touch(getStateUpdatedSignalPath());
  }
}

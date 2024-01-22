import { Io, SignalReader } from "./io";
import { Request, Response } from "./types";

class FallbackInboundSignal implements SignalReader {
  private signalMap = new Map<Io, SignalReader>();

  constructor(name: string, private ios: Io[]) {
    this.signalMap = new Map();

    for (const io of ios) {
      this.signalMap.set(io, io.getInboundSignal(name));
    }
  }

  async getVersion(): Promise<string | null> {
    let error: Error | undefined;

    for (const io of this.ios) {
      try {
        const version = await this.signalMap.get(io)!.getVersion();
        if (version != null) {
          return version;
        }
      } catch (err) {
        error ??= err as Error;
      }
    }

    if (error != null) {
      throw error;
    }

    return null;
  }
}

export class FallbackIo implements Io {
  constructor(private ioList: Io[]) {}

  async initialize(): Promise<void> {
    for (const io of this.ioList) {
      await io.initialize();
    }
  }

  async prepareResponse(): Promise<void> {
    for (const io of this.ioList) {
      await io.prepareResponse();
    }
  }

  async closeResponse(): Promise<void> {
    for (const io of this.ioList) {
      await io.closeResponse();
    }
  }

  async readRequest(): Promise<Request> {
    let error: Error | undefined;

    for (let i = 0; i < this.ioList.length; i++) {
      const io = this.ioList[i];
      try {
        const request = await io.readRequest();

        // Remove any lower priority IOs, because we now know that this IO
        // is active.
        for (let j = i + 1; j < this.ioList.length; j++) {
          await this.ioList[j].closeResponse();
        }
        this.ioList.splice(i + 1);

        return request;
      } catch (err) {
        error ??= err as Error;
      }
    }

    throw error;
  }

  async writeResponse(response: Response): Promise<void> {
    for (const io of this.ioList) {
      await io.writeResponse(response);
    }
  }

  getInboundSignal(name: string): SignalReader {
    return new FallbackInboundSignal(name, this.ioList);
  }
}

import { Io, SignalReader } from "./io";
import { Request, Response } from "./types";

class FallbackInboundSignal implements SignalReader {
  private signals: SignalReader[];

  constructor(name: string, ios: Io[]) {
    this.signals = ios.map((io) => io.getInboundSignal(name));
  }

  async getVersion(): Promise<string | null> {
    let error: Error | undefined;

    for (const signal of this.signals) {
      try {
        const version = await signal.getVersion();
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

/**
 * An {@link Io} that tries to read from multiple {@link Io}s in order until it
 * finds one that works.  If none of them work, it throws the error from the
 * highest-priority {@link Io}. For some methods, it stops after the highest
 * priority {@link Io} that succeeds; for other methods it runs all of them.
 *
 * As an optimization, it removes all {@link Io}s after the highest-priority
 * {@link Io} that has had an active request.
 */
export class FallbackIo implements Io {
  /** The {@link IO} from which we successfully read a request */
  private activeIo: Io | null = null;

  /**
   * The index of the highest-priority IO that has had an active request.  If no IO
   * has had an active request, this is integer max
   */
  private highestPriorityActiveIoIndex = Number.MAX_SAFE_INTEGER - 1;

  constructor(private ioList: Io[]) {}

  initialize(): Promise<void> {
    return safeRunAll(this.ioList, (io) => io.initialize());
  }

  prepareResponse(): Promise<void> {
    // As an optimization, remove all IOs after the highest-priority IO that has
    // had an active request
    this.ioList.splice(this.highestPriorityActiveIoIndex + 1);

    return safeRunAll(this.ioList, (io) => io.prepareResponse());
  }

  closeResponse(): Promise<void> {
    return safeRunAll(this.ioList, (io) => io.closeResponse());
  }

  async readRequest(): Promise<Request> {
    // Note that unlike the methods above, we stop after the first successful
    // read because only one IO should be successful

    /** The error from the highest priority IO */
    let firstError: Error | undefined;

    for (let i = 0; i < this.ioList.length; i++) {
      const io = this.ioList[i];
      try {
        const request = await io.readRequest();
        this.activeIo = io;
        this.highestPriorityActiveIoIndex = i;
        return request;
      } catch (err) {
        firstError ??= err as Error;
      }
    }

    throw firstError;
  }

  async writeResponse(response: Response): Promise<void> {
    if (this.activeIo == null) {
      throw new Error("No active IO; this shouldn't happen");
    }
    // Only respond to the IO that had the active request
    await this.activeIo.writeResponse(response);
    this.activeIo = null;
  }

  getInboundSignal(name: string): SignalReader {
    return new FallbackInboundSignal(name, this.ioList);
  }
}

/**
 * Calls {@link fn} for each item in {@link items}, catching any errors and
 * throwing the first one after all items have been processed if none of them
 * succeeded.
 *
 * @param items The items to iterate over
 * @param fn The function to call for each item
 */
async function safeRunAll<T>(
  items: T[],
  fn: (item: T) => Promise<void>
): Promise<void> {
  let firstError: Error | undefined;
  let success = false;

  for (const item of items) {
    try {
      await fn(item);
      success = true;
    } catch (err) {
      firstError ??= err as Error;
    }
  }

  if (!success) {
    throw firstError;
  }
}

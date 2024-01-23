import { Request, Response } from "./types";

export interface SignalReader {
  /**
   * Gets the current version of the signal. This version string changes every
   * time the signal is emitted, and can be used to detect whether signal has
   * been emitted between two timepoints.
   * @returns The current signal version or null if the signal file could not be
   * found
   */
  getVersion: () => Promise<string | null>;
}

export interface Io {
  initialize(): Promise<void>;
  // Prepares to send a response to readRequest, preventing any other process
  // from doing so until closeResponse is called.  Throws an error if called
  // twice before closeResponse.
  prepareResponse(): Promise<void>;
  // Closes a prepared response, allowing other processes to respond to
  // readRequest. Throws an error if the prepareResponse has not been called.
  closeResponse(): Promise<void>;
  // Returns a request from Talon command client.
  readRequest(): Promise<Request>;
  // Writes a response. Throws an error if prepareResponse has not been called.
  writeResponse(response: Response): Promise<void>;
  // Returns a SignalReader.
  getInboundSignal(name: string): SignalReader;
}

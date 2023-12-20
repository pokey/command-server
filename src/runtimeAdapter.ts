import {initializeCommunicationDir} from "./initializeCommunicationDir";
import {Request, Response} from "./types";

export interface SignalReader {
  getVersion: () => Promise<string | null>;
}

export interface RuntimeAdapter {
 initializeCommunicationDir: () => Promise<void>;
  lockResponse: () => Promise<void>;
  closeResponse: () => Promise<void>;
  readRequest: () => Promise<Request> ;
  writeResponse: (response: Response)=>Promise<void>;
  getInboundSignal: (name: string) => SignalReader;
}

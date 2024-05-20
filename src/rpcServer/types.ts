interface RequestBase {
    /**
     * A uuid that will be written to the response file for sanity checking
     * client-side
     */
    uuid: string;

    /**
     * A boolean indicating if we should return the output of the command
     */
    returnCommandOutput: boolean;

    /**
     * A boolean indicating if we should await the command to ensure it is
     * complete.  This behaviour is desirable for some commands and not others.
     * For most commands it is ok, and can remove race conditions, but for
     * some commands, such as ones that show a quick picker, it can hang the
     * client
     */
    waitForFinish: boolean;
}

export interface RequestV0 extends RequestBase {
    /**
     * The id of the command to run
     */
    commandId: string;

    /**
     * Arguments to the command, if any
     */
    args: any[];
}

export interface RequestV1 extends RequestBase {
    /**
     * The version of the request API
     */
    version: 1;

    /**
     * The payload/body of the request
     */
    payload: unknown;
}

export type Request = RequestV0 | RequestV1;

export const LATEST_REQUEST_VERSION = 1 as const;

export type RequestLatest = RequestV1;

export interface Response {
    /**
     * The uuid passed into the response for sanity checking client-side
     */
    uuid: string;

    /**
     * The return value of the command, if requested.
     */
    returnValue?: unknown;

    /**
     * A list of warnings issued when running the command
     */
    warnings: string[];

    /**
     * Any error encountered or null if successful
     */
    error: string | null;
}

export interface RequestCallbackOptions {
    warn(text: string): void;
}

export type Callback<T> = (
    payload: T,
    options: RequestCallbackOptions
) => unknown;

export interface RpcServer<T> {
    executeRequest: (callback: Callback<T>) => Promise<void>;
    getInboundSignal: (name: string) => SignalReader;
}

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

export interface FileSystem {
    initialize: () => Promise<void>;
    // Prepares to send a response to readRequest, preventing any other process
    // from doing so until closeResponse is called.  Throws an error if called
    // twice before closeResponse.
    prepareResponse: () => Promise<void>;
    // Closes a prepared response, allowing other processes to respond to
    // readRequest. Throws an error if the prepareResponse has not been called.
    closeResponse: () => Promise<void>;
    // Returns a request from Talon command client.
    readRequest: () => Promise<Request>;
    // Writes a response. Throws an error if prepareResponse has not been called.
    writeResponse: (response: Response) => Promise<void>;
    // Returns a SignalReader.
    getInboundSignal: (name: string) => SignalReader;
}

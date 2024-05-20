import type {
    RequestCallback,
    FileSystem,
    RequestCallbackOptions,
    RequestLatest,
    RpcServer,
    SignalReader,
} from "./types";
import { upgradeRequest } from "./upgradeRequest";

export class RpcServerFs<T> implements RpcServer<T> {
    constructor(private fileSystem: FileSystem) {}

    async executeRequest(callback: RequestCallback<T>) {
        await this.fileSystem.prepareResponse();

        let request: RequestLatest;

        try {
            const requestInput = await this.fileSystem.readRequest();
            request = upgradeRequest(requestInput);
        } catch (err) {
            await this.fileSystem.closeResponse();
            throw err;
        }

        const { uuid, returnCommandOutput, waitForFinish, payload } = request;

        const warnings: string[] = [];

        const options: RequestCallbackOptions = {
            warn: (text) => warnings.push(text),
        };

        try {
            // Wrap in promise resolve to handle both sync and async functions
            const commandPromise = Promise.resolve(
                callback(payload as T, options)
            );

            let commandReturnValue = null;

            if (returnCommandOutput) {
                commandReturnValue = await commandPromise;
            } else if (waitForFinish) {
                await commandPromise;
            }

            await this.fileSystem.writeResponse({
                uuid,
                warnings,
                error: null,
                returnValue: commandReturnValue,
            });
        } catch (err) {
            await this.fileSystem.writeResponse({
                uuid,
                warnings,
                error: (err as Error).message,
            });
        }

        await this.fileSystem.closeResponse();
    }

    getInboundSignal(name: string): SignalReader {
        return this.fileSystem.getInboundSignal(name);
    }
}

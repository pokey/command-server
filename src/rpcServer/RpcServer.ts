import * as fs from "fs/promises";
import * as path from "path";
import { readRequest, writeResponse } from "./io";
import type { RequestCallbackOptions, RequestLatest } from "./types";
import { upgradeRequest } from "./upgradeRequest";

export class RpcServer<T> {
    private requestPath: string;
    private responsePath: string;
    private callback: (payload: T, options: RequestCallbackOptions) => unknown;

    constructor(
        private dirPath: string,
        callback: (payload: T, options: RequestCallbackOptions) => unknown
    ) {
        this.requestPath = path.join(this.dirPath, "request.json");
        this.responsePath = path.join(this.dirPath, "response.json");
        this.callback = callback;
    }

    async executeRequest() {
        const responseFile = await fs.open(this.requestPath, "wx");

        let request: RequestLatest;

        try {
            const requestInput = await readRequest(this.requestPath);
            request = upgradeRequest(requestInput);
        } catch (err) {
            await responseFile.close();
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
                this.callback(payload as T, options)
            );

            let commandReturnValue = null;

            if (returnCommandOutput) {
                commandReturnValue = await commandPromise;
            } else if (waitForFinish) {
                await commandPromise;
            }

            await writeResponse(responseFile, {
                uuid,
                warnings,
                error: null,
                returnValue: commandReturnValue,
            });
        } catch (err) {
            await writeResponse(responseFile, {
                uuid,
                warnings,
                error: (err as Error).message,
            });
        }

        await responseFile.close();
    }
}

import * as fs from "fs/promises";
import * as path from "path";
import { initializeCommunicationDir } from "./initializeCommunicationDir";
import { readRequest, writeResponse } from "./io";
import type { RequestLatest } from "./types";
import { upgradeRequest } from "./upgradeRequest";

export class RpcServer<T> {
    private requestPath: string;
    private responsePath: string;

    constructor(private dirPath: string) {
        this.requestPath = path.join(this.dirPath, "request.json");
        this.responsePath = path.join(this.dirPath, "response.json");
        initializeCommunicationDir(this.dirPath);
    }

    async executeRequest(callback: (payload: T) => unknown) {
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

        // TODO: Do we need this?
        const warnings: string[] = [];

        try {
            const commandPromise = Promise.resolve(callback(payload as T));

            let commandReturnValue = null;

            if (returnCommandOutput) {
                commandReturnValue = await commandPromise;
            } else if (waitForFinish) {
                await commandPromise;
            }

            await writeResponse(responseFile, {
                uuid,
                returnValue: commandReturnValue,
                error: null,
                warnings,
            });
        } catch (err) {
            await writeResponse(responseFile, {
                uuid,
                error: (err as Error).message,
                warnings,
            });
        }

        await responseFile.close();
    }
}

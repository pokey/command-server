import { LATEST_REQUEST_VERSION } from "./types";
import type { Request, RequestLatest } from "./types";

export function upgradeRequest(request: Request): RequestLatest {
    if (!("version" in request)) {
        return upgradeRequest({
            version: 1,
            uuid: request.uuid,
            returnCommandOutput: request.returnCommandOutput,
            waitForFinish: request.waitForFinish,
            payload: {
                commandId: request.commandId,
                args: request.args,
            },
        });
    }

    while (request.version < LATEST_REQUEST_VERSION) {
        switch (request.version) {
            default:
                throw new Error(
                    `Can't upgrade from unknown version: ${request.version}`
                );
        }
    }

    if (request.version !== LATEST_REQUEST_VERSION) {
        throw Error(`Request is not latest version`);
    }

    return request;
}

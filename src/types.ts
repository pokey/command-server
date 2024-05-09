/**
 * The type of the focused element in vscode at the moment of the command being executed.
 */
export type FocusedElementType = "textEditor" | "terminal";

export interface Payload {
    /**
     * The id of the command to run
     */
    commandId: string;

    /**
     * Arguments to the command, if any
     */
    args: any[];
}

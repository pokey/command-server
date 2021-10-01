// How old a request file needs to be before we declare it stale and are willing
// to remove it
export const STALE_TIMEOUT_MS = 60000;

// The amount of time that client is expected to wait for VSCode to perform a
// command, in seconds
export const VSCODE_COMMAND_TIMEOUT_MS = 3000;

export const FOCUS_KEY = "core.focus";
export const EDITOR_FOCUSED = "editor";
export const TERMINAL_FOCUSED = "terminal";
export const UNKNOWN_FOCUSED = null;

export const TERMINALS_KEY = "core.terminals";
export const ACTIVE_TERMINAL_KEY = "core.activeTerminal";
export const VISIBLE_EDITORS_KEY = "core.visibleEditors";
export const ACTIVE_EDITOR_KEY = "core.activeEditor";
export const FOCUSED_EDITOR_KEY = "core.focusedEditor";
export const FOCUSED_TERMINAL_KEY = "core.focusedTerminal";

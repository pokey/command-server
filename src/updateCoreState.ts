import { Terminal, TextDocument, TextEditor, window, workspace } from "vscode";
import {
  ACTIVE_EDITOR_KEY,
  ACTIVE_TERMINAL_KEY,
  EDITOR_FOCUSED,
  FOCUSED_EDITOR_KEY,
  FOCUSED_TERMINAL_KEY,
  FOCUS_KEY,
  TERMINALS_KEY,
  TERMINAL_FOCUSED,
  VISIBLE_EDITORS_KEY,
  WORKSPACE_FOLDERS_KEY,
} from "./constants";
import State from "./state";

export async function updateCoreState(
  workspaceState: State,
  globalState: State
) {
  const focus = workspaceState.get<string | null>(FOCUS_KEY);

  const editors = window.visibleTextEditors.map(serializeTextEditor);

  const activeEditor =
    window.activeTextEditor == null
      ? null
      : serializeTextEditor(window.activeTextEditor);

  await workspaceState.update(VISIBLE_EDITORS_KEY, editors);
  await workspaceState.update(ACTIVE_EDITOR_KEY, activeEditor);
  await workspaceState.update(
    FOCUSED_EDITOR_KEY,
    focus === EDITOR_FOCUSED ? activeEditor : null
  );
  await workspaceState.update(
    FOCUSED_TERMINAL_KEY,
    focus === TERMINAL_FOCUSED
      ? workspaceState.get<string | null>(ACTIVE_TERMINAL_KEY)
      : null
  );

  await workspaceState.update(
    WORKSPACE_FOLDERS_KEY,
    workspace.workspaceFolders?.map((folder) => ({
      uri: folder.uri.toString(),
      name: folder.name,
    })) ?? []
  );
}

export async function updateTerminalState(
  workspaceState: State,
  globalState: State
) {
  const terminals = await Promise.all(window.terminals.map(serializeTerminal));
  const activeTerminal =
    window.activeTerminal == null
      ? null
      : await serializeTerminal(window.activeTerminal);
  await workspaceState.update(TERMINALS_KEY, terminals);
  await workspaceState.update(ACTIVE_TERMINAL_KEY, activeTerminal);
}

function serializeTextEditor(textEditor: TextEditor) {
  return { document: serializeDocument(textEditor.document) };
}

function serializeDocument(document: TextDocument) {
  const { uri, isUntitled, isDirty, fileName, languageId, version } = document;
  return {
    uri: uri.toString(),
    isUntitled,
    isDirty,
    fileName,
    languageId,
    version,
  };
}

async function serializeTerminal(terminal: Terminal) {
  const { name } = terminal;

  return { name, processId: await terminal.processId };
}

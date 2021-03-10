// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as http from "http";
import { AddressInfo } from "net";
import { writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { getRequestJSON } from "./getRequestJSON";

interface Command {
  commandId: string;
  args: any[];
  expectResponse: boolean;
}

export function activate(context: vscode.ExtensionContext) {
  var port: number | null = null;

  const server = http.createServer(async function (req, res) {
    if (!vscode.window.state.focused) {
      res.writeHead(401);
      res.end("This editor is not active");
      return;
    }

    const commandInfo: Command = await getRequestJSON(req);

    vscode.commands.executeCommand(commandInfo.commandId, ...commandInfo.args);

    res.writeHead(200);
    res.end();
  });

  server.listen(0, "localhost", function () {
    const address: AddressInfo = (server.address() as unknown) as AddressInfo;
    port = address.port;

    console.log("Listening on port " + address.port);

    if (vscode.window.state.focused) {
      writePort();
    }
  });

  const windowStateDisposable = vscode.window.onDidChangeWindowState(
    (event) => {
      if (event.focused && port !== null) {
        writePort();
      }
    }
  );

  function writePort() {
    const path = join(tmpdir(), "vscode-port");
    console.log(`Saving port ${port} to path ${path}`);
    writeFileSync(path, `${port}`);
  }

  context.subscriptions.push(windowStateDisposable, {
    dispose() {
      server.close();
    },
  });
}

// this method is called when your extension is deactivated
export function deactivate() {}

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as http from "http";
import { AddressInfo } from "net";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { getRequestJSON } from "./getRequestJSON";
import { randomBytes } from "crypto";

interface Command {
  commandId: string;
  args: any[];
  expectResponse: boolean;
  waitForFinish: boolean;
  nonce: string;
}

export function activate(context: vscode.ExtensionContext) {
  var port: number | null = null;
  const nonce = randomBytes(10).toString("hex");

  const server = http.createServer(async function (req, res) {
    if (!vscode.window.state.focused) {
      res.writeHead(401);
      res.end("This editor is not active");
      return;
    }

    const commandInfo: Command = await getRequestJSON(req);

    if (commandInfo.nonce !== nonce) {
      res.writeHead(403);
      res.end("Please provide nonce");
      return;
    }

    const commandPromise = vscode.commands.executeCommand(
      commandInfo.commandId,
      ...commandInfo.args
    );

    var commandReturnValue;

    if (commandInfo.expectResponse || commandInfo.waitForFinish) {
      commandReturnValue = await commandPromise;
    }

    res.writeHead(200);

    if (commandInfo.expectResponse) {
      res.write(JSON.stringify(commandReturnValue));
    }

    res.end();
  });

  server.listen(0, "localhost", function () {
    const address: AddressInfo = server.address() as unknown as AddressInfo;
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

  // We keep a monotonically increasing write counter so that the port file is
  // guaranteed to change every time we write to it.  This way a client can use
  // the `command-server.writePort` command to request us to update the port
  // file, and then wait for it to change.
  var fileWriteCounter = 0;

  function writePort() {
    const path = getPortPath();
    console.log(`Saving port ${port} to path ${path}`);

    const portInfo = {
      port,
      fileWriteCounter,
      nonce,
    };

    fileWriteCounter++;

    writeFileSync(path, JSON.stringify(portInfo));
  }

  let disposable = vscode.commands.registerCommand(
    "command-server.writePort",
    writePort
  );

  context.subscriptions.push(disposable, windowStateDisposable, {
    dispose() {
      server.close();
    },
  });

  function getPortPath() {
    return join(tmpdir(), "vscode-port");
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}

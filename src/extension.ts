// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as http from "http";
import { AddressInfo } from "net";
import { writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

interface Command {
  commandId: string;
  args: any[];
  expectResponse: boolean;
  timestamp: Date;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "command-server" is now active!'
  );

  var port: number | null = null;
  //create a server object:
  const server = http.createServer(function (req, res) {
    console.log("Got request");
    var body = "";
    req.on("data", function (chunk) {
      body += chunk;
    });
    req.on("end", function () {
      console.log("POSTed: " + body);
      const { timestamp: rawTimestamp, ...rest } = JSON.parse(body);
      const commandInfo = {
        ...rest,
        // timestamp: new Date(rawTimestamp),
      };
      console.dir(commandInfo);

      vscode.commands.executeCommand(
        commandInfo.commandId,
        ...commandInfo.args
      );
      res.writeHead(200);
      res.end("Hello World!");
    });
  });

  server.listen(0, "localhost", function () {
    const address: AddressInfo = (server.address() as unknown) as AddressInfo;
    port = address.port;
    console.log("Listening on port " + address.port);
    if (vscode.window.state.focused) {
      writePort();
    }
  });

  vscode.window.onDidChangeWindowState((event) => {
    if (event.focused && port !== null) {
      writePort();
    }
  });

  function writePort() {
    var path = join(tmpdir(), "vscode-port");
    writeFileSync(path, `${port}`);
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}

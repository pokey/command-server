# command-server README

Creates an http server listening for commands. 

## Features

On startup, spawns an http server listening for commands. The port of the server for the active editor is written to a file named `vscode-port` in the operating system's default directory for temporary files.

Accepts requests of the form:

```http
POST /execute-command HTTP/1.1

{
  "commandId": "some-command-id",
  "args": [
    "default"
  ]
}
```

## Release Notes

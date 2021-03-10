# command-server README

Creates an http server listening for commands. 

## Features

On startup, spawns an http server listening for commands to execute. The port
of the server for the active editor is written to a file named `vscode-port` in
the operating system's default directory for temporary files.

Accepts requests of the form:

```http
POST /execute-command HTTP/1.1

{
  "commandId": "some-command-id",
  "args": [
    "some-argument"
  ]
}
```

Upon receiving the above, this extension would run the command
`some-command-id` with argument `"some-argument"`.

Note that the server is bound to `localhost`, so it will only accept commands
from processes running on the same host as VSCode.

## Release Notes

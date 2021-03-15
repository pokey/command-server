# command-server README

Creates an http server that exposes a REST api to execute commands. 

## Features

On startup, spawns an http server listening for commands to execute. Each
running VSCode editor workspace runs its own server, each of which pick a
different random free port on which to listen.
The port of the server for the active editor is written to a file named
`vscode-port` in the operating system's default directory for temporary files.

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

If you'd like the server to wait for the command to finish before responding,
pass `waitForFinish=true`.

If you'd like the server to wait for the command to finish and then respond
with the command return value encoded as JSON, pass `expectResponse=true`.

Note that the server is bound to `localhost`, so it will only accept commands
from processes running on the same host as VSCode.

### Python example

```py
import requests
from pathlib import Path
from tempfile import gettempdir


port_file_path = Path(gettempdir()) / "vscode-port"
port = port_file_path.read_text()

response = requests.post(
    f"http://localhost:{port}/execute-command",
    json={
        "commandId": "some-command-id",
        "args": ["some-argument"],
    },
    timeout=(0.05, 3.05),
)
response.raise_for_status()
```

## Known issues

- The server won't respond until the extension is loaded.  This may be obvious,
  but just be aware that if you have other extensions that take a while to
  load, the server might not respond for a little while after you load an
  editor window until everything is fully loaded.

## Release Notes

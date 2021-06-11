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
import json
import requests
from pathlib import Path
from tempfile import gettempdir


port_file_path = Path(gettempdir()) / "vscode-port"
contents = json.loads(port_file_path.read_text())
port = contents["port"]

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

## Troubleshooting

If you're running into issues with commands interleaving with keystrokes, or the extension not responding, the server supports a command `command-server.runCommand`, which will cause the extension to update the port and write a monotonically increasing counter variable to the port file.  You can run this command (via keyboard shortcut) and then wait for the file to update to ensure you're talking to the right vscode instance and to ensure that the command will not interleave with other keyboard shortcuts issued to VSCode.

Here's some example code for this mode of operation. Note that this assumes
that you have a function `actions.key` that presses the given key (eg
[talon](https://talonvoice.com/)):

```py
import json
import requests
import time
from pathlib import Path
from tempfile import gettempdir

port_file_path = Path(gettempdir()) / "vscode-port"
original_contents = port_file_path.read_text()

# Issue command to VSCode telling it to update the port file.  Because only
# the active VSCode instance will accept keypresses, we can be sure that
# the active VSCode instance will be the one to write the port.
if is_mac:
    actions.key("cmd-shift-alt-p")
else:
    actions.key("ctrl-shift-alt-p")

# Wait for the VSCode instance to update the port file.  This generally
# happens within the first millisecond, but we give it 3 seconds just in
# case.
start_time = time.monotonic()
new_contents = port_file_path.read_text()
while original_contents == new_contents:
    time.sleep(0.001)
    if time.monotonic() - start_time > 3.0:
        raise Exception("Timed out waiting for VSCode to update port file")
    new_contents = port_file_path.read_text()

port = json.loads(new_contents)["port"]

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

### 0.4.0
- Add nonce for security
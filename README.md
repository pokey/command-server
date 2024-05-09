# command-server README

Adds support for running arbitrary commands via file-based RPC. Designed for
use with voice-control systems such as [Talon](https://talonvoice.com/).

## Features

On startup, creates a directory in the default tmp directory, called
`vscode-command-server-${userName}`, where `${userName}` is the username. Then
waits for the `command-server.runCommand` command to be issued, which will
trigger the command server to read the `request.json` file in the communication
directory, execute the command requested there, and write the response to
`response.json`. Note that we write the JSON response on a single line, with a
trailing newline, so that the client can repeatedly try to read the file until
it finds a final newline to indicate that the write is complete.

Note that the command server will refuse to execute a command if the request file is older than 3 seconds.

Requests look as follows:

```json
{
  "commandId": "some-command-id",
  "args": ["some-argument"]
}
```

See `Request` and `Response` [types](src/types.ts) for supported request / response parameters.

Upon receiving the above, this extension would run the command
`some-command-id` with argument `"some-argument"`.

If you'd like the server to wait for the command to finish before responding,
pass `waitForFinish=true`.

If you'd like the server to wait for the command to finish and then respond
with the command return value encoded as JSON, pass `expectResponse=true`.

### Python example

Have a look at
[talon-vscode-command-client](https://github.com/pokey/talon-vscode-command-client).

## Commands

Contributes the following commands:

- `command-server.runCommand`: Reads from the requests.json file and executes the given command.

## Keyboard shortcuts

| Key                                                                | Command     |
| ------------------------------------------------------------------ | ----------- |
| <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>F17</kbd> | Run command |

## Configuration

Contributes the following settings:

### `command-server.allowList`

Allows user to specify the allowed commands using glob syntax, eg:

```json
{
  "command-server.allowList": ["workbench.*"]
}
```

Defaults to `["*"]` (allows everything).

### `command-server.denyList`

Allows user to specify the denied commands using glob syntax, eg:

```json
{
  "command-server.denyList": ["workbench.*"]
}
```

Defaults to `[]` (doesn't deny anything).

## Building

### Nix

The extension can be built using the `flake.nix` file using the following command:

```bash
nix build
```

The resulting `.vsix` file will be placed in the `result/` folder.

## Troubleshooting

## Known issues

- The server won't respond until the extension is loaded. This may be obvious,
  but just be aware that if you have other extensions that take a while to
  load, the server might not respond for a little while after you load an
  editor window until everything is fully loaded.
- There is a very unlikely race condition. If the front VSCode is hung
  when you issue a command, and then you switch to another VSCode, and issue a
  command, then if the first instance wakes up at the exact right moment it
  could execute the command. There is code in the command server that tries to
  prevent a background window from inadvertently executing a command, but
  VSCode seems to be a bit inconsistent with determining which window has
  focus. When this focused window detection fails, it will end up [preventing
  correct commands from running](https://github.com/knausj85/knausj_talon/issues/466). Thus, this protection has been disabled by
  default, as the scenario it protects against has never been observed in practice. If you do have issues with background windows trying to execute
  commands, please file an issue, and we can look into another way to prevent
  this from occurring.

## Change Log

See [CHANGELOG.md](CHANGELOG.md).

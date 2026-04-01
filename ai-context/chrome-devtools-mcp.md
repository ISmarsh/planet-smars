# Chrome DevTools MCP Setup

Connect Claude Code to a live browser for DOM inspection, script evaluation, network monitoring, and screenshots.

## Package

`chrome-devtools-mcp` ([GitHub](https://github.com/ChromeDevTools/chrome-devtools-mcp)) -- works with Chrome, Brave, and other Chromium browsers.

## Recommended Setup: Connect to Existing Browser

Launching a separate browser instance blocks OAuth flows (Google rejects automation-controlled browsers). Instead, connect to the user's regular browser via the Chrome DevTools Protocol (CDP).

### 1. Launch Browser with Remote Debugging

Close all instances first, then relaunch with the debugging port:

```powershell
# PowerShell (Windows) -- use & to avoid -- parsing issues
& "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" --remote-debugging-port=9222
```

```bash
# macOS/Linux
/Applications/Brave\ Browser.app/Contents/MacOS/Brave\ Browser --remote-debugging-port=9222
```

> **Note:** If the browser was already running, the flag is silently ignored. Close all instances first.

### 2. Configure MCP Server

```bash
claude mcp add chrome-devtools --scope user -- npx -y chrome-devtools-mcp@latest --browser-url=http://127.0.0.1:9222 --no-usage-statistics
```

Or in `~/.claude.json`:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest",
        "--browser-url=http://127.0.0.1:9222",
        "--no-usage-statistics"
      ]
    }
  }
}
```

### 3. Restart VSCode

The MCP server connects on startup. After restart, verify with `list_pages`.

## Key CLI Flags

| Flag | Description |
|---|---|
| `--browser-url=URL` | Connect to running browser (e.g., `http://127.0.0.1:9222`) |
| `--executable-path=PATH` | Launch a specific browser (not recommended for OAuth apps) |
| `--ws-endpoint=URL` | WebSocket endpoint (alternative to `--browser-url`) |
| `--auto-connect` | Chrome 144+ only, not available in Brave |
| `--headless` | Run headless (no UI) |
| `--slim` | Expose only navigation, script execution, and screenshots |
| `--no-usage-statistics` | Opt out of Google telemetry |
| `--accept-insecure-certs` | Ignore SSL errors (useful for `https://localhost`) |

## Common Tools

- `list_pages` / `select_page` -- see and switch between tabs
- `navigate_page` -- go to URL, back, forward, reload
- `take_screenshot` -- capture viewport or full page
- `evaluate_script` -- run JS in page context (must return JSON-serializable values)
- `list_network_requests` / `get_network_request` -- inspect network traffic
- `list_console_messages` / `get_console_message` -- read console output

## Gotchas

- **Browser must be launched with `--remote-debugging-port`** -- adding it after launch does nothing.
- **`--browser-url` uses hyphen**, not camelCase. The flag is `--browser-url`, not `--browserUrl`.
- **Google OAuth blocks automation-controlled browsers** -- use `--browser-url` to connect to a regular browser instead of letting the MCP launch one.
- **IndexedDB data may be stored as JSON strings** -- parse with `JSON.parse()` when reading via `evaluate_script`.
- **Windows:** Node.js v20.19+ required. May need `SystemRoot` and `PROGRAMFILES` env vars set.

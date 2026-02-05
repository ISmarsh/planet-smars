#!/bin/bash
# Notification: Show a desktop notification for Claude Code events.
# Receives JSON on stdin with message and notification_type fields.
#
# Register in ~/.claude/settings.json:
#   "Notification": [{
#     "matcher": "",
#     "hooks": [{ "type": "command", "command": "~/.claude/hooks/notify.sh", "timeout": 15 }]
#   }]
#
# Platform-specific:
#   Windows — calls notify.ps1 (requires BurntToast module)
#   macOS   — uses osascript (built-in)
#   Linux   — uses notify-send (install: apt install libnotify-bin)

INPUT=$(cat)

MESSAGE=$(echo "$INPUT" | python -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('message', 'Needs your attention'))
" 2>/dev/null || echo "Needs your attention")

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*)
    # Windows (Git Bash) — delegate to PowerShell + BurntToast
    powershell -ExecutionPolicy Bypass -File "$SCRIPT_DIR/notify.ps1" -Message "$MESSAGE"
    ;;
  Darwin)
    # macOS — native notification
    osascript -e "display notification \"$MESSAGE\" with title \"Claude Code\""
    ;;
  Linux)
    # Linux — notify-send
    notify-send "Claude Code" "$MESSAGE" 2>/dev/null
    ;;
esac

exit 0

# Claude Code Context

Claude-specific configuration that extends the cross-tool AGENTS.md guidance.

@AGENTS.md

---

## Claude-Specific Notes

### Co-Author Attribution

For AI-assisted commits, use:
```
Co-Authored-By: Claude <noreply@anthropic.com>
```

Or with model version:
```
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### Hooks

Claude Code hooks enforce AGENTS.md conventions automatically. See
[hooks/README.md](../hooks/README.md) for the full reference.

**Key hooks:**
- **guardrail.sh** (PreToolUse) — blocks force push, secrets staging,
  destructive git/rm commands
- **copilot-reminder.sh** (PostToolUse) — post-push Copilot review reminder
- **pre-compact.sh** (PreCompact) — captures git state before compaction
- **context-reminder.sh** (SessionStart) — re-injects conventions after compaction
- **setup-path.sh** (SessionStart) — adds CLI tools to PATH
- **notify.sh** (Notification) — desktop notifications (Windows/macOS/Linux)

Hooks live in `~/.claude/hooks/` (user-global) and are registered in
`~/.claude/settings.json`.

**Architecture:** Allows in settings are coarse (command prefix like
`Bash(git push:*)`), hooks are precise (regex on full command). This lets you
keep convenient auto-approvals while blocking specific dangerous patterns.

### Tool Setup (Claude Code)

The `gh` CLI should be available in PATH for PR management, review workflows,
and GraphQL API access. The `setup-path.sh` hook handles this automatically
by extending PATH on session start via `CLAUDE_ENV_FILE`.

### Import Syntax

Claude Code uses `@path/to/file` syntax for imports:
- Paths are relative to the file containing the import
- Regular markdown links (`[text](url)`) are just text — not followed
- Max import depth: 5 hops

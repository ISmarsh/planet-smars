# Claude Code Context

Claude-specific configuration that extends the cross-tool AGENTS.md guidance.

@AGENTS.md

---

## Claude-Specific Notes

### Communication Style

- Be direct and technical
- Explain design decisions when non-obvious
- Acknowledge trade-offs honestly
- Don't over-praise or validate unnecessarily
- Disagree when warranted — correctness over agreement

### Co-Author Attribution

For AI-assisted commits, use:
```
Co-Authored-By: Claude <noreply@anthropic.com>
```

Or with model version:
```
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### Tool Setup (Claude Code)

The `gh` CLI should be available in PATH for PR management, review workflows,
and GraphQL API access. If running in an environment with limited PATH,
configure hooks to extend PATH on startup.

**Example:** Adding tools via session start hook:

```bash
#!/bin/bash
if [ -n "$CLAUDE_ENV_FILE" ]; then
  # Add CLI tools not found in default PATH
  if [ -d "/custom/path/to/tool" ]; then
    echo 'export PATH="$PATH:/custom/path/to/tool"' >> "$CLAUDE_ENV_FILE"
  fi
fi
exit 0
```

Tools added to `CLAUDE_ENV_FILE` persist for the entire session.

### Import Syntax

Claude Code uses `@path/to/file` syntax for imports:
- Paths are relative to the file containing the import
- Regular markdown links (`[text](url)`) are just text — not followed
- Max import depth: 5 hops

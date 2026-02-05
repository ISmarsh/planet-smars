# AI Context Templates

Cross-tool AI assistant context following the [AGENTS.md convention](https://github.com/anthropics/agents-md).

## Files

| File | Purpose | Tool Support |
|------|---------|--------------|
| `AGENTS.md` | Universal development guidance | Cursor, Copilot, Devin, Windsurf, Cline, etc. |
| `CLAUDE.md` | Claude Code-specific config (imports AGENTS.md) | Claude Code |
| `copilot-instructions.md` | Code review priorities | GitHub Copilot |

## Architecture

```
AGENTS.md          ← Cross-tool compatible (60,000+ repos use this convention)
    ↑
CLAUDE.md          ← Imports AGENTS.md via @AGENTS.md, adds Claude-specific notes
```

This approach gives you:
- **Broad compatibility** — AGENTS.md works with most AI coding tools
- **Claude-specific features** — CLAUDE.md adds co-author attribution, import syntax notes, etc.
- **Single source of truth** — Core guidance lives in AGENTS.md

## Usage

### As a Git Submodule (Recommended)

```bash
git submodule add https://github.com/ISmarsh/planet-smars .planet-smars
```

In your project's CLAUDE.md, use the `@import` syntax:

```markdown
# My Project — Claude Context

## Universal Guidance

<!-- @import: Claude Code includes this file's content -->
@.planet-smars/templates/ai-context/CLAUDE.md

> *[View shared context](.planet-smars/templates/ai-context/CLAUDE.md) — git, testing, PR workflows*

---

## Project-Specific Context

[Your project-specific context here]
```

**Important:** The `@path/to/file` syntax is how Claude Code imports content.
Regular markdown links (`[text](url)`) are just text — they won't be followed.
The blockquote link is for human readers.

#### Auto-init Submodules

Add to your package.json to auto-init submodules on `npm install`:

```json
{
  "scripts": {
    "postinstall": "git submodule update --init --recursive"
  }
}
```

### Direct Copy

Copy files to your project root and customize as needed.

## What's Included

### AGENTS.md (Cross-Tool)

- **Git Practices** — Commit format, branching, merge commits over squash
- **PR Review Workflow** — GitHub CLI commands, thread resolution, `gh pr checks --watch`
- **Testing** — Philosophy, patterns for hooks/components/utilities
- **Code Principles** — Minimal changes, no over-engineering, security checklist
- **Accessibility** — a11y audit checklist, semantic HTML reminders
- **Workflow Discipline** — Scope creep checkpoints, pre-commit verification
- **Shell & Path Handling** — Cross-platform compatibility, escaping

### CLAUDE.md (Claude-Specific)

- **Co-Author Attribution** — Standard format for AI-assisted commits
- **Hooks** — Overview of guardrails, reminders, and session management hooks
- **Tool Setup** — `CLAUDE_ENV_FILE` hook for GitHub CLI and other tools
- **Import Syntax** — How `@path/to/file` works in Claude Code

### copilot-instructions.md

- **What to Flag** — Bugs, security issues, accessibility problems
- **What NOT to Flag** — Style preferences, over-engineering suggestions

## Related Templates

- **[hooks/](../hooks/)** — Claude Code hooks that enforce AGENTS.md conventions
  (guardrails, reminders, notifications). See [hooks/README.md](../hooks/README.md).

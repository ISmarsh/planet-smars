# Skills Templates

Claude Code skills (custom slash commands) for common workflows.

## Available Skills

| Skill | Description | Trigger |
|-------|-------------|---------|
| `pr-flow/` | Create PR with full workflow (branch, commit, push, PR, checks, reviews) | `/pr-flow` |

## Installation

### Personal Skills (Recommended)

Install once, available in all projects. Best for general-purpose skills like `pr-flow`.

```bash
cp -r templates/skills/pr-flow ~/.claude/skills/
```

Skills in `~/.claude/skills/` are loaded for every project. Update manually when
planet-smars changes (rare for stable skills).

### Project Skills

Install per-project. Best for project-specific workflows or when you want the
skill version-controlled with the project.

```bash
mkdir -p .claude/skills
cp -r templates/skills/pr-flow .claude/skills/
```

**Note:** Claude Code doesn't support loading skills from arbitrary paths (like
a submodule). You must copy to `.claude/skills/` or use symlinks.

## Usage

After installation, invoke with:

```
/pr-flow
/pr-flow feature/add-dark-mode
/pr-flow "Add user authentication"
```

## Creating Custom Skills

Skills are markdown files with YAML frontmatter:

```yaml
---
name: my-skill
description: What this skill does (shown in help, used for auto-invocation)
disable-model-invocation: true  # Only user can trigger (recommended for actions)
allowed-tools:
  - Bash(git *)
  - Bash(npm *)
---

# Instructions for Claude

Describe what the skill should do...
```

### Frontmatter Options

| Field | Purpose |
|-------|---------|
| `name` | Slash command name (defaults to directory name) |
| `description` | When to use; shown in `/help` |
| `disable-model-invocation` | `true` = only you can invoke |
| `user-invocable` | `false` = only Claude can invoke |
| `allowed-tools` | Tools Claude can use without permission |
| `context` | `fork` = run in isolated subagent |

See [Claude Code docs](https://docs.anthropic.com/en/docs/claude-code) for full reference.

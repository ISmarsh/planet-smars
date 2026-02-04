# Claude Context Templates

Ready-to-use AI context files for development projects.

## Files

- **CLAUDE.md** — Universal guidance for Claude Code and similar AI assistants
- **copilot-instructions.md** — Review instructions for GitHub Copilot

## Usage

### As a Git Submodule (Recommended)

```bash
# Add to your project
git submodule add https://github.com/ISmarsh/planet-smars .planet-smars
```

In your project's CLAUDE.md, use the `@import` syntax to include the guidance:

```markdown
# My Project — Claude Context

## Universal Guidance

@.planet-smars/templates/claude-context/CLAUDE.md

---

## Project-Specific Context

[Your project-specific guidance here]
```

**Important:** The `@path/to/file` syntax is how Claude Code imports content.
Regular markdown links (`[text](url)`) are just text - they won't be followed.

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

Copy the files to your project and customize as needed.

## What's Included

### CLAUDE.md

- **Git Practices** — Commit format, branching, merging (always merge commits)
- **PR Review Workflow** — GitHub CLI commands (REST + GraphQL), thread resolution
- **Testing** — Philosophy, patterns for hooks/components/utilities
- **Code Change Principles** — Do/don't lists, security checklist
- **Communication Style** — Direct, technical, honest feedback
- **PR Wrap-up Checklist** — Duplication, obsolete code, documentation review
- **Copilot Auto-Review Workflow** — Triage process, common dismissals
- **Questions to Ask Pattern** — Clarify before implementing
- **Shell & Path Handling** — Cross-platform paths, escaping pitfalls
- **Tool Setup Notes** — GitHub CLI configuration, PATH setup

### copilot-instructions.md

- **What to Flag** — Bugs, security vulnerabilities, accessibility issues, correctness errors
- **What NOT to Flag** — Premature optimization, over-engineering, style nitpicks, intentional patterns
- **Core Philosophy** — Focus on substantive issues over subjective preferences

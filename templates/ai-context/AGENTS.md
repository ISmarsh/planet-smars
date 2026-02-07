# AI Coding Agent Guidance

## Communication Style

- Be direct and technical
- Explain design decisions when non-obvious
- Acknowledge trade-offs honestly
- Don't over-praise or validate unnecessarily
- Disagree when warranted — correctness over agreement

## New Project Setup

When initializing a new project with planet-smars as a submodule, follow the [INIT.md checklist](../INIT.md) to configure:

1. **CI workflow** — lint, test, build on PRs
2. **GitHub Pages deployment** (if applicable)
3. **Branch protection** — require PRs for main
4. **Copilot auto-review** (optional)
5. **Accessibility audit** (optional)

## Git Practices

### Commits

- Atomic commits: one logical change per commit
- Message format: imperative mood, explain *why* not just *what*
- Include co-author attribution for AI-assisted commits
- **Never amend after push** — make a new commit instead (amending requires force-push)

### Branches

- Keep feature branches short-lived
- Rebase on main before merging to reduce noise
- Delete branches after merge

### Pull Requests

- Keep PRs focused on a single concern
- Never force-push to shared branches
- **Enable branch protection** requiring PRs for main (prevents accidental direct pushes)

### Merging PRs

- **Always use merge commits** (`gh pr merge --merge`), not squash or rebase unless explicitly requested

## PR Review Workflow

Use `gh pr checks --watch` for CI status. See [pr-workflow.md](pr-workflow.md) for detailed commands.

1. Fetch unresolved threads (GraphQL)
2. Triage: fix actionable items, note dismissals
3. Make code changes
4. Reply to each comment (explain fix or dismissal reason)
5. Resolve all threads via batched mutation
6. Commit and push

## Testing

### Philosophy

- Test behavior and public APIs, not implementation details or internal state
- Prefer integration tests over unit tests when testing components
- Use descriptive test names that explain *what* and *why*

### When to Write Tests

- New hooks or utilities: always test
- Components with logic: test render output and interactions
- Bug fixes: add a regression test before fixing
- Refactors: ensure existing tests pass (add coverage if missing)

For code examples (hooks, components, utilities), see [testing.md](testing.md).

### What Not to Test

- Third-party library internals
- Styling or layout details (unless critical)
- Simple pass-through components with no logic

## Code Change Principles

### Do

- Read existing code before suggesting modifications
- Match existing patterns in the codebase
- Keep solutions simple and focused
- Fix only what was asked — avoid scope creep
- Consider security implications (XSS, injection, auth)
- Maintain accessibility (WCAG 2.1 AA)
- Use ASCII only in executed code (scripts, source files) — reserve non-ASCII (em dashes, smart quotes, arrows) for human-facing documentation

### Do Not

- Expand scope — extra features, tangential refactors, speculative abstractions
- Add error handling for scenarios that can't happen
- Add comments, type annotations, or dependencies without justification
- Optimize prematurely without measurements
- Sacrifice clarity for brevity
- Add backwards-compatibility shims, `// removed` comments, or `_var` renames

### Quality Checklists

Before completing any change, verify security and accessibility. See [checklists.md](checklists.md) for the full security and WCAG 2.1 AA accessibility checklists. Use Playwright + axe-core for automated a11y audits.

## Workflow Discipline

### Focus and scope

- Batch context file updates in a todo list; commit at PR wrap-up
- When unrelated work emerges, ask: "Defer to a separate PR?" Options: defer, quick-branch, or consciously expand scope

### Context-conscious delegation

Prefer subagents for heavy exploration to keep the main context lean.

### Multi-session continuity

For work spanning multiple sessions, capture state before ending: current branch, pending changes, what's been verified, what still needs validation. Memory files and todo lists bridge the gap — future sessions start from captured state, not from scratch.

### Pre-commit verification

Run the build before committing to catch TypeScript/build errors. Tests run in CI, so don't run locally unless debugging a specific failure.

For non-code projects (markdown, data files, docs-only repos), run a manual content review instead:

- **Duplicates across sections** — same item in two tables/categories
- **Items in wrong categories** — miscategorized by type or scope
- **Contradictory descriptions** — wording that doesn't match actual behavior
- **Inconsistent empty fields** — use explicit "—" vs omitting

### Running dev servers

Use VSCode tasks — background processes survive editor restarts and cause port conflicts.

### Data workflows

For batch operations, use disposable scripts (scratchpad, not committed). Prefer APIs over scraping. See [data-practices.md](data-practices.md) for detailed patterns.

## PR Wrap-up Checklist

Before merging, verify CI passes (build, lint, tests) and run manual quality checks: code duplication, obsolete code, documentation accuracy, attribution, and review comment triage. See [pr-workflow.md](pr-workflow.md) for the full checklist.

## Clarifying Requirements

Prefer asking questions over making assumptions. For complex or vague requests, check for missing [CARE](https://www.nngroup.com/articles/careful-prompts/) components:

| Component | Question to Ask If Missing |
|-----------|---------------------------|
| **C**ontext | "What's the background? (project type, user needs, constraints)" |
| **A**sk | "What specific output do you need? (format, scope, deliverable)" |
| **R**ules | "Any constraints? (style guide, dependencies, performance limits)" |
| **E**xamples | "Can you show an example of what you want? (or what you don't want)" |

## Shell & Path Handling

Use Unix-style paths on Windows (`/c/path` not `C:\path`). Use `<<'EOF'` (quoted) heredocs for complex content.

**PowerShell from bash:** If a PowerShell command uses `$` variables, don't attempt inline escaping — write a `.ps1` file and invoke it with `powershell -ExecutionPolicy Bypass -File script.ps1`. This is the only reliable approach.

For examples, escaping pitfalls, and tool availability, see [shell-reference.md](shell-reference.md).

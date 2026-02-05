# AI Coding Agent Guidance

Universal guidance for AI-assisted development. This file follows the
[AGENTS.md](https://agents.md) convention for cross-tool compatibility.

## Communication Style

- Be direct and technical
- Explain design decisions when non-obvious
- Acknowledge trade-offs honestly
- Don't over-praise or validate unnecessarily
- Disagree when warranted — correctness over agreement

## New Project Setup

When initializing a new project with planet-smars as a submodule, follow the
[INIT.md checklist](../INIT.md) to configure:

1. **CI workflow** — lint, test, build on PRs
2. **GitHub Pages deployment** (if applicable)
3. **Branch protection** — require PRs for main
4. **Copilot auto-review** (optional)
5. **Accessibility audit** (optional)

This ensures consistent tooling across all projects from day one.

## Git Practices

### Commits

- Atomic commits: one logical change per commit
- Message format: imperative mood, explain *why* not just *what*
- Include co-author attribution for AI-assisted commits
- **Never amend after push** — amending before the first push is fine, but
  once a commit is pushed, make a new commit for fixes. Amending a pushed
  commit requires force-push, which rewrites shared history.

### Branches

- Keep feature branches short-lived
- Rebase on main before merging to reduce noise
- Delete branches after merge

### Pull Requests

- Keep PRs focused on a single concern
- Never force-push to shared branches
- **Enable branch protection** requiring PRs for main (prevents accidental direct pushes)

**Note:** GitHub has two protection systems:
- **Rulesets** (newer): `gh api repos/OWNER/REPO/rulesets`
- **Branch protection rules** (older): `gh api repos/OWNER/REPO/branches/main/protection`

Prefer rulesets for new repos.

### Merging PRs

- **Always use merge commits** (`gh pr merge --merge`), not squash or rebase
- Preserves individual commit history in main branch
- Never use `--squash` or `--rebase` unless explicitly requested

## PR Review Workflow

Use `gh pr checks --watch` for CI status. For detailed commands (GraphQL
queries, thread resolution, Copilot triage and review verification), see
[pr-workflow.md](pr-workflow.md).

### Typical review workflow

1. Fetch unresolved threads (GraphQL)
2. Triage: fix actionable items, note dismissals
3. Make code changes
4. Reply to each comment (explain fix or dismissal reason)
5. Resolve all threads via batched mutation
6. Commit and push

## Testing

### Philosophy

- Write tests for behavior, not implementation details
- Prefer integration tests over unit tests when testing components
- Test the public API, not internal state
- Use descriptive test names that explain *what* and *why*

### When to Write Tests

- New hooks or utilities: always test
- Components with logic: test render output and interactions
- Bug fixes: add a regression test before fixing
- Refactors: ensure existing tests pass (add coverage if missing)

For code examples (hooks, components, utilities), see
[testing.md](testing.md).

### What Not to Test

- Third-party library internals
- Styling or layout details (unless critical)
- Implementation details that may change
- Simple pass-through components with no logic

## Code Change Principles

### Do

- Read existing code before suggesting modifications
- Match existing patterns in the codebase
- Keep solutions simple and focused
- Fix only what was asked — avoid scope creep
- Consider security implications (XSS, injection, auth)
- Maintain accessibility (WCAG 2.1 AA)

### Do Not

- Add features beyond what was requested
- Refactor surrounding code while fixing a bug
- Add abstractions for patterns that appear fewer than 3 times
- Add error handling for scenarios that can't happen
- Create helpers or utilities for one-time operations
- Add comments explaining obvious code
- Add type annotations to code you didn't change
- Optimize prematurely without measurements
- Add dependencies without justification
- Sacrifice clarity for brevity
- Add backwards-compatibility shims — just change the code
- Leave `// removed` comments or rename unused variables to `_var`

### Security Checklist

Before completing any change, verify:
- [ ] No user input rendered as raw HTML (XSS)
- [ ] No string concatenation in SQL/commands (injection)
- [ ] No secrets in code or logs
- [ ] No overly permissive CORS or auth
- [ ] Dependencies are from trusted sources

### Accessibility Checklist

Target **WCAG 2.1 AA** compliance:

- [ ] Images have alt text (or `alt=""` for decorative)
- [ ] Form inputs have associated labels
- [ ] Interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Color is not the only means of conveying information
- [ ] Text has sufficient contrast (4.5:1 for normal, 3:1 for large)
- [ ] Page has proper heading hierarchy (h1 → h2 → h3)
- [ ] ARIA attributes used correctly (prefer semantic HTML first)

**Automated testing:** Use Playwright + axe-core for CI audits.

## Workflow Discipline

### Batch context updates

When noticing something that should be added to context files during feature work,
collect it in a todo list instead of editing immediately. At PR wrap-up (or in
a separate docs PR), batch all context updates into a single commit. This
prevents documentation churn scattered across feature PRs.

### Scope creep checkpoints

When unrelated work emerges mid-feature, ask: "This is unrelated to [current
branch purpose]. Defer to a separate PR?" Options:
- **Defer** — add to a todo/issue for later
- **Quick-branch** — stash, fix on a new branch, return
- **Expand scope** — conscious decision, not drift

### Context-conscious delegation

Prefer subagents for heavy exploration (multi-file searches, broad codebase
scans, web research) to keep the main conversation context lean. Large tool
outputs in the main context accelerate compaction, which can degrade session
quality. Subagents isolate that bulk and return only the summary.

### Pre-commit verification

Before suggesting a commit for a feature, run the build to catch TypeScript/build
errors. Tests typically run in CI on every push, so don't run them locally unless
debugging a specific failure.

For non-code projects (markdown, data files, docs-only repos), there's no
automated lint or build. Run a manual content review instead — this becomes
the primary quality gate:

- **Duplicates across sections** — same item in two tables/categories
- **Items in wrong categories** — miscategorized by type or scope
- **Contradictory descriptions** — wording that doesn't match actual behavior
- **Inconsistent empty fields** — use explicit "—" vs omitting

### Running dev servers

Don't spawn dev servers as background processes — they survive editor restarts
and cause port conflicts. Use VSCode tasks (`.vscode/tasks.json`) instead;
VSCode terminates them when the editor closes.

### Data workflows

For batch operations, use disposable scripts (scratchpad, not committed).
Prefer APIs over scraping. Validate after every change (verify-iterate cycle).
Tier large research tasks by priority.

See [data-practices.md](data-practices.md) for detailed patterns: disposable
scripts, verify-iterate cycles, data integrity auditing, external data
sourcing, and tiered research.

## PR Wrap-up Checklist

Before merging a pull request, consider these checks:

### Automated Checks
- Build, lint, and tests (typically handled by CI)
- Security scanning and accessibility audits (if configured)

### Manual Checks

**1. Code duplication check**
- Scan for duplicated logic across files
- Extract when a pattern appears **3+ times** AND reduces actual code
- Don't over-abstract for 2 instances
- Good: consolidating duplicate message strings
- Bad: a helper that just wraps a standard library call with no reduction

**2. Obsolete code check**
- Look for unused imports
- Dead functions or unreachable code
- Stale comments referencing removed features
- Old commented-out code blocks

**3. Documentation review**
- Verify README matches current implementation
- Check that code examples still work
- Update architecture docs if structure changed
- Confirm file listings are accurate

**4. Attribution & licensing**
- Update Credits page when adding external data sources (APIs, datasets)
- Review and follow API/data terms of service (rate limits, attribution, usage restrictions)
- Include required logos/text for APIs that mandate them (e.g., TMDB)
- Note fan-curated vs official content to avoid implying endorsement
- Verify license compatibility before adding dependencies or data sources

**5. Review comment triage** (if using automated reviewers)
- Categorize comments: fix, dismiss, or already-addressed
- Reply to each comment explaining the action taken
- Resolve threads after addressing
- Present dismissals for approval before resolving

## Questions to Ask Pattern

When users request features, clarify approach before implementing:

- "Would you like me to explain the concept first, or dive straight into code?"
- "Are there any constraints I should be aware of (performance, compatibility, etc.)?"
- "Should this integrate with existing patterns, or establish a new approach?"
- "Do you prefer a minimal implementation first, or a more complete solution?"

Prefer asking questions over making assumptions. Better to clarify than redo work.

### CARE Checklist

Before starting complex tasks, check if the user provided enough information using
the [CARE framework](https://www.nngroup.com/articles/careful-prompts/):

| Component | Question to Ask If Missing |
|-----------|---------------------------|
| **C**ontext | "What's the background? (project type, user needs, constraints)" |
| **A**sk | "What specific output do you need? (format, scope, deliverable)" |
| **R**ules | "Any constraints? (style guide, dependencies, performance limits)" |
| **E**xamples | "Can you show an example of what you want? (or what you don't want)" |

If a request is vague, ask for the missing CARE components rather than guessing.

## Markdown Conventions

### Sequential Steps

For sequential workflows, avoid numbered headings (`### 1. Step One`). Instead:
- Use descriptive headings without numbers (`### Check Current State`)
- Add "Follow these steps in order:" at the top if sequence matters
- Let the document order convey the sequence

This avoids renumbering when steps are added/removed/reordered.

### Auto-Numbered Lists

Markdown auto-numbers list items when you use `1.` repeatedly:
```markdown
1. First item
1. Second item
1. Third item
```
Renders as 1, 2, 3. This only works for list items, not headings.

## Shell & Path Handling

Use Unix-style paths on Windows (`/c/path` not `C:\path`). Escape `$` and
backticks in shell strings. Use `<<'EOF'` (quoted) heredocs for complex content.

For cross-platform details, escaping pitfalls, PowerShell interop, and tool
availability, see [shell-reference.md](shell-reference.md).

# AI Coding Agent Guidance

Universal guidance for AI-assisted development. This file follows the
[AGENTS.md](https://agents.md) convention for cross-tool compatibility.

## Git Practices

### Commits

- Atomic commits: one logical change per commit
- Message format: imperative mood, explain *why* not just *what*
- Include co-author attribution for AI-assisted commits

### Branches

- Keep feature branches short-lived
- Rebase on main before merging to reduce noise
- Delete branches after merge

### Pull Requests

- Keep PRs focused on a single concern
- Never force-push to shared branches

### Merging PRs

- **Always use merge commits** (`gh pr merge --merge`), not squash or rebase
- Preserves individual commit history in main branch
- Never use `--squash` or `--rebase` unless explicitly requested

## PR Review Workflow (GitHub CLI)

### Fetching unresolved review threads

The REST API (`/pulls/{pr}/comments`) returns all comments with no resolved filter.
Use GraphQL instead:

```bash
gh api graphql -f query='query {
  repository(owner: "OWNER", name: "REPO") {
    pullRequest(number: PR_NUMBER) {
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          comments(first: 1) {
            nodes { body path line databaseId }
          }
        }
      }
    }
  }
}'
```

Filter results for `isResolved: false`.

### Replying to comments

```bash
gh api repos/OWNER/REPO/pulls/PR/comments/COMMENT_ID/replies -f body="Reply text"
```

Use `databaseId` from GraphQL (numeric) for the REST reply endpoint.

### Resolving threads (batched)

```bash
gh api graphql -f query='mutation {
  t1: resolveReviewThread(input: {threadId: "PRRT_..."}) { thread { isResolved } }
  t2: resolveReviewThread(input: {threadId: "PRRT_..."}) { thread { isResolved } }
}'
```

### Checking CI status

**Default approach:** Use `--watch` to wait for checks to complete:

```bash
gh pr checks <PR_NUMBER> --watch
```

This is the preferred method — no polling or manual refresh needed.

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

### Testing Patterns

**React hooks:**
```typescript
import { renderHook, act } from '@testing-library/react'

it('updates state correctly', () => {
  const { result } = renderHook(() => useMyHook())
  act(() => { result.current.doSomething() })
  expect(result.current.value).toBe('expected')
})
```

**Components:**
```typescript
import { render, screen } from '@testing-library/react'

it('renders the expected content', () => {
  render(<MyComponent />)
  expect(screen.getByRole('heading')).toHaveTextContent('Title')
})
```

**Utilities:**
```typescript
it('handles edge cases', () => {
  expect(myUtil(null)).toBe('default')
  expect(myUtil('input')).toBe('output')
})
```

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

### Pre-commit verification

Before suggesting a commit for a feature, run the build to catch TypeScript/build
errors. Tests typically run in CI on every push, so don't run them locally unless
debugging a specific failure.

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

**4. Review comment triage** (if using automated reviewers)
- Categorize comments: fix, dismiss, or already-addressed
- Reply to each comment explaining the action taken
- Resolve threads after addressing
- Present dismissals for approval before resolving

## Copilot Auto-Review Workflow

If the repo has GitHub Copilot configured to review PRs automatically:

### Setup

Enable Copilot reviews via repo Settings → Rules → Rulesets, or manually
trigger via PR page → Reviewers → gear icon → select "copilot-pull-request-reviewer".

### Triage Process

**While CI runs**, check for Copilot comments (typically posts within a minute).

Categorize each comment:
- **Fix**: Real bugs, logic errors, missing edge cases in new code
- **Dismiss**: Stylistic preferences, over-engineering, suggestions for code
  not changed in the PR
- **Already fixed**: Issues addressed by other commits

**Common dismissals:**
- Unnecessary `useMemo`/`useCallback` wrapping (unless measured perf issue)
- Dependency array pedantry for stable React setState
- Suggestions to add complexity for hypothetical future cases
- Over-abstraction for patterns that appear < 3 times

### Resolution

1. **Never batch-resolve** without reading each comment — Copilot occasionally
   finds real bugs
2. **Present dismissals** to user for approval before posting replies
3. Use the PR Review Workflow above for replying and resolving threads

### If Copilot Doesn't Review

Sometimes skips commits (small changes, rapid pushes). Manually trigger via
GitHub UI: PR page → Reviewers (right sidebar) → gear icon → select
"copilot-pull-request-reviewer". The `gh` CLI doesn't support this.

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

## Shell & Path Handling

### Cross-Platform Paths

When working on Windows with bash-like shells (Git Bash, WSL, MSYS2):

- Use Unix-style paths: `/c/Users/name` not `C:\Users\name`
- Forward slashes work universally: `cd /c/Dev/project`
- Avoid Windows path literals in shell commands

### Escaping Pitfalls

**Backticks:** Interpreted as command substitution
```bash
# Bad - backticks execute as command
gh api ... -f body="Fix the `error` handling"

# Good - use single quotes or escape
gh api ... -f body='Fix the error handling'
```

**Dollar signs:** Variable expansion
```bash
# Bad - $variable expands (usually to empty)
echo "Cost is $50"

# Good - escape or single-quote
echo "Cost is \$50"
echo 'Cost is $50'
```

**Quotes in JSON:** Double-escape or use heredocs
```bash
# Heredoc for complex content
git commit -m "$(cat <<'EOF'
Message with "quotes" and $pecial chars
EOF
)"
```

**Newlines:** Don't use literal newlines to chain commands
```bash
# Bad - newline breaks command
cd /path
npm install

# Good - && chains or separate calls
cd /path && npm install
```

### Common Fixes

| Issue | Solution |
|-------|----------|
| Path not found (Windows) | Use `/c/path` not `c:\path` |
| Command not found | Check PATH, use full path |
| Unexpected token | Escape special chars (`$`, `` ` ``, `"`) |
| Heredoc issues | Use `<<'EOF'` (quoted) to prevent expansion |

### Cross-Platform Tool Availability

Some Unix tools aren't available by default on Windows:

| Tool | Status | Alternative |
|------|--------|-------------|
| `jq` | Not on Windows Git Bash | Use `--jq` flag with `gh` CLI, or PowerShell's `ConvertFrom-Json` |
| `sed` | Limited in Git Bash | Use dedicated Edit tool or PowerShell |
| `awk` | Limited in Git Bash | Use dedicated tools or scripting |

Prefer tool-native filtering (e.g., `gh api --jq '.field'`) over piping to `jq`.

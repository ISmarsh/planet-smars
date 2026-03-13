# GitHub Actions

Patterns and gotchas for GitHub Actions workflows used across projects.

## Reusable Workflows (`workflow_call`) — Permissions

Job-level `permissions:` blocks in a reusable workflow **override** the caller's workflow-level grant — they don't merge. Any permission not listed in a job's block is dropped silently.

**Consequences:**
- If the caller sets `id-token: write` at workflow level, but a reusable job lists its own permissions without `id-token: write`, the job loses OIDC access → `Unable to get ACTIONS_ID_TOKEN_REQUEST_URL`
- If the repo default is `read`, a caller with no `permissions:` block triggers `startup_failure` on all jobs

**Fix — caller (consumer repo):**

```yaml
# Required by claude-code-action for OIDC token + write access.
# The repo default is often read-only; omitting this causes startup_failure.
permissions:
  contents: write
  pull-requests: write
  issues: write
  id-token: write
```

**Fix — reusable workflow:** every job that uses OIDC must include `id-token: write` in its own `permissions:` block (not just the caller's workflow level):

```yaml
jobs:
  my-job:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      id-token: write   # Must repeat here — job-level overrides caller
```

## Workflow Self-Introduction Gap

A PR that introduces a new workflow file won't trigger that workflow on itself. The first run happens on the next event after merge to the base branch.

This is expected GitHub behavior. Accept an UNSTABLE/no-checks state for the introducing PR and verify functionality on a follow-up PR or the next organic trigger.

## `claude-code-action` — Version Pinning

Pin to `@v1` (tracks latest v1.x). The older `@beta` tag is 260+ commits behind and has a broken prepare step that fails to checkout the repo.

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    prompt: "Your prompt here"
```

The `@beta` tag used `direct_prompt`; `@v1` renamed it back to `prompt`.

## Fork PRs and `workflow_call`

`pull_request` events from forks do NOT have access to repo secrets, so jobs that require `ANTHROPIC_API_KEY` or other secrets won't run on fork PRs. Use `pull_request_target` only if you understand the security implications (the base branch code runs with secret access, not the PR branch code).

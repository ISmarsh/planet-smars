# New Project Setup Checklist

Use this checklist when initializing a new project that uses planet-smars as a submodule.

## Prerequisites

- [ ] Repository created on GitHub
- [ ] Local clone with planet-smars submodule added

```bash
git submodule add https://github.com/ISmarsh/planet-smars .planet-smars
```

## 1. CI Workflow

Copy the CI workflow to run lint, test, and build on PRs:

```bash
mkdir -p .github/workflows
cp .planet-smars/templates/github-workflows/ci.yml .github/workflows/
```

**Required npm scripts:** `lint`, `test`, `build`

See [github-workflows/README.md](github-workflows/README.md) for customization options.

## 2. GitHub Pages Deployment (if applicable)

For static sites deployed to GitHub Pages:

```bash
cp .planet-smars/templates/github-workflows/deploy-gh-pages.yml .github/workflows/
```

Then configure in GitHub:
1. Go to repo Settings → Pages
2. Set Source to "GitHub Actions"

## 3. Branch Protection

Require PRs for the main branch to prevent accidental direct pushes:

```bash
# Using GitHub rulesets (preferred)
gh api repos/OWNER/REPO/rulesets -X POST -f name="main protection" \
  -f target="branch" -f enforcement="active" \
  --json conditions='{"ref_name":{"include":["refs/heads/main"]}}' \
  --json rules='[{"type":"pull_request"}]'
```

Or configure via GitHub UI: Settings → Rules → Rulesets → New ruleset

## 4. Auto-Delete Branches

Automatically delete branches after PR merge:

```bash
gh api repos/OWNER/REPO -X PATCH -f delete_branch_on_merge=true
```

Or configure via GitHub UI: Settings → General → Pull Requests → "Automatically delete head branches"

## 5. Copilot Auto-Review (optional)

Enable Copilot to automatically review PRs:

1. Settings → Rules → Rulesets
2. Edit main protection ruleset
3. Add rule: "Require code review from Copilot"

Or manually trigger per-PR via Reviewers → gear icon → copilot-pull-request-reviewer

## 6. Accessibility Audit (optional)

For projects with UI, add automated accessibility testing:

```bash
cp .planet-smars/templates/a11y-audit/audit-a11y.mjs scripts/
```

Add to package.json:
```json
{
  "scripts": {
    "audit:a11y": "node scripts/audit-a11y.mjs"
  },
  "devDependencies": {
    "@axe-core/playwright": "^4.x",
    "playwright": "^1.x"
  }
}
```

Then add the a11y job to your CI workflow (see github-workflows/README.md).

## 7. VSCode Configuration

Copy debug/task configuration for consistent dev experience:

```bash
mkdir -p .vscode
cp .planet-smars/templates/react-vite/.vscode/* .vscode/ 2>/dev/null || true
```

## Verification

After setup, verify:

- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npm run build` passes
- [ ] Push a test branch and confirm CI runs
- [ ] (If Pages) Confirm deploy workflow triggers on main

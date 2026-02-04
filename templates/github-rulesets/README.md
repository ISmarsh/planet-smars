# GitHub Rulesets

Reusable ruleset templates for new repos.

## Usage

Apply to a repo via GitHub API:

```bash
gh api repos/OWNER/REPO/rulesets -X POST --input main.json
gh api repos/OWNER/REPO/rulesets -X POST --input copilot-auto-review.json
```

## Rulesets

### main.json

Branch protection for default branch:
- Requires pull requests (0 approvers, but thread resolution required)
- Prevents deletion and force push

### copilot-auto-review.json

Automatic Copilot code review on push:
- Reviews non-draft PRs on push
- Uses CodeQL, ESLint, and PMD analysis tools

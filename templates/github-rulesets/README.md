# GitHub Rulesets

Reusable ruleset templates for new repos.

## Usage

Apply to a repo via GitHub API:

```bash
gh api repos/OWNER/REPO/rulesets -X POST --input main.json
```

## main.json

Single ruleset protecting the default branch:

- **Pull requests** -- required, with thread resolution (0 approvers)
- **Deletion** -- prevented
- **Force push** -- prevented
- **Copilot code review** -- auto-reviews non-draft PRs on push
- **Analysis tools** -- CodeQL, ESLint, PMD

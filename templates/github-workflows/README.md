# GitHub Workflows Templates

Reusable GitHub Actions workflow templates for Node.js projects.

## Available Workflows

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | Lint, test, and build on PRs and main pushes |
| `deploy-gh-pages.yml` | Deploy to GitHub Pages on main pushes |

## Usage

Copy the workflow files to your project's `.github/workflows/` directory:

```bash
mkdir -p .github/workflows
cp templates/github-workflows/ci.yml .github/workflows/
cp templates/github-workflows/deploy-gh-pages.yml .github/workflows/
```

## Customization

### CI Workflow

- **Node version**: Change `node-version: '20'` to your version
- **Path ignores**: Adjust `paths-ignore` to skip unnecessary runs
- **Scripts**: Assumes `npm run lint`, `npm test`, `npm run build` exist

### Deploy Workflow

- **Build output**: Change `path: './dist'` if your build outputs elsewhere
- **Trigger branch**: Change `branches: ['main']` if using a different branch

## Prerequisites

For GitHub Pages deployment:

1. Go to repo Settings → Pages
2. Set Source to "GitHub Actions"
3. The workflow handles the rest

## Adding Tests to CI

To add accessibility testing (Playwright + axe-core):

```yaml
a11y:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
    - run: npx playwright install chromium --with-deps
    - run: npm run audit:a11y
```

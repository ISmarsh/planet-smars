# Templates

Reusable project scaffolding and configuration templates.

## Available Templates

| Template | Description | Usage |
|----------|-------------|-------|
| `a11y-audit/` | Playwright + axe-core accessibility audit | Copy to `scripts/` |
| `claude-context/` | AI assistant context (CLAUDE.md, copilot-instructions) | Submodule or copy |
| `github-workflows/` | GitHub Actions for CI and deployment | Copy to `.github/workflows/` |
| `react-vite/` | React + Vite + Tailwind + TypeScript starter | Copy and customize |

---

## claude-context

Universal AI assistant context for development projects.

### Contents

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Development guidance (Git, PR workflows, code principles, security) |
| `copilot-instructions.md` | Code review priorities for automated reviewers |
| `README.md` | Integration instructions |

### Usage

**Option 1: Git Submodule**

```bash
git submodule add https://github.com/ISmarsh/planet-smars .planet-smars

# Reference from your CLAUDE.md:
# > See .planet-smars/templates/claude-context/CLAUDE.md for base context
```

**Option 2: Direct Copy**

```bash
cp templates/claude-context/CLAUDE.md .
cp templates/claude-context/copilot-instructions.md .github/
```

---

## github-workflows

GitHub Actions workflow templates for Node.js projects.

### Contents

| File | Purpose |
|------|---------|
| `ci.yml` | Lint, test, and build on PRs and main pushes |
| `deploy-gh-pages.yml` | Deploy to GitHub Pages |

### Usage

```bash
mkdir -p .github/workflows
cp templates/github-workflows/*.yml .github/workflows/
```

See `github-workflows/README.md` for customization options.

---

## react-vite

Minimal React starter with Tailwind CSS, TypeScript, and dark mode.

### Features

- React 19 + Vite
- TypeScript with path aliases (`@/`)
- Tailwind CSS with CSS variable theming
- Dark mode via `useTheme` hook
- React Router v7
- Vitest + Testing Library
- ESLint + jsx-a11y
- Credits/licensing page

### Usage

```bash
# Copy template
cp -r templates/react-vite my-new-app
cd my-new-app

# Install and run
npm install
npm run dev
```

### Customization

After copying:

1. Update `name` in `package.json`
2. Update `GITHUB_URL` in `src/components/Layout.tsx`
3. Customize colors in `src/index.css`
4. Update license info in `src/pages/CreditsPage.tsx`

See `react-vite/README.md` for full documentation.

---

## Design Principles

1. **Ready to use** — No placeholders that break. Works immediately.
2. **Minimal** — Only essential dependencies. Add what you need.
3. **Documented** — Clear customization instructions included.
4. **Composable** — Templates can reference each other.

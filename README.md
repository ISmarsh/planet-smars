# planet-smars

Personal utility repo for submoduling into various projects.

## Contents

### `/templates`

Reusable project scaffolding and configuration templates.

| Template | Description |
|----------|-------------|
| `claude-guidance/` | Universal AI assistant guidance (CLAUDE.md, copilot-instructions) |
| `react-vite/` | React + Vite + Tailwind + TypeScript starter |

## Usage

### As Git Submodule

```bash
# Add to your project
git submodule add https://github.com/smarshian/planet-smars .planet-smars

# Reference templates from your project files
# In CLAUDE.md: "See .planet-smars/templates/claude-guidance/CLAUDE.md"
```

### Direct Copy

```bash
# Copy what you need
cp -r planet-smars/templates/react-vite my-new-app
```

## Placeholders to Update

When using the **react-vite** template, update these placeholders:

| File | Placeholder | Purpose |
|------|-------------|---------|
| `package.json` | `"name": "my-app"` | Your app name |
| `index.html` | `<title>My App</title>` | Browser tab title |
| `src/components/Layout.tsx` | `GITHUB_URL` constant | Your GitHub repo link |
| `src/components/Layout.tsx` | `"My App"` in header | Your app name |
| `src/pages/CreditsPage.tsx` | License text | Your license |
| `src/index.css` | CSS variables | Your color scheme |
| `vite.config.ts` | `base` path | For GitHub Pages deployment |

## Design Principles

1. **No reinventing wheels** — Use existing libraries when they exist
2. **Ready to use** — Templates work immediately after copying
3. **Minimal** — Only essential dependencies included
4. **Composable** — Projects extend rather than duplicate

## License

MIT

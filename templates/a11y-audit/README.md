# Accessibility Audit Template

Playwright + axe-core accessibility audit script for Vite projects.

## Features

- Audits all routes at multiple viewports (mobile + desktop)
- Tests both light and dark themes (if using theme toggle)
- Outputs JSON report with violation details
- Exits with error code for CI integration
- Summary of unique violations across all pages

## Setup

### 1. Install Dependencies

```bash
npm install -D playwright @axe-core/playwright
npx playwright install chromium
```

### 2. Copy Script

```bash
cp templates/a11y-audit/audit-a11y.mjs scripts/
```

### 3. Add npm Script

```json
{
  "scripts": {
    "audit:a11y": "node scripts/audit-a11y.mjs"
  }
}
```

### 4. Configure Routes

Edit the `ROUTES` array in the script to match your app:

```javascript
const ROUTES = [
  { path: '/', name: 'Home' },
  { path: '/about', name: 'About' },
  { path: '/contact', name: 'Contact' },
];
```

### 5. Configure Theme (Optional)

If your app uses a theme toggle with localStorage:

```javascript
const THEME_KEY = 'app-theme';  // your localStorage key
```

Set to `null` if not using theme toggle:

```javascript
const THEME_KEY = null;
```

## Usage

```bash
npm run audit:a11y
```

Output:
```
Starting Vite dev server...
Dev server running at http://localhost:5174

--- LIGHT / DESKTOP ---
  ✓ Home [light, desktop]: 0 violations, 45 passes
  ✓ About [light, desktop]: 0 violations, 32 passes
--- LIGHT / MOBILE ---
  ...

Results written to axe-audit.json

Summary: 8 audits, 0 total violations (0 unique rules)
```

## CI Integration

See [github-workflows/README.md](../github-workflows/README.md#adding-tests-to-ci) for the
a11y job configuration to add to your CI workflow.

## Customization

### Viewports

```javascript
const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },  // add more as needed
};
```

### Axe Rules

To exclude specific rules or configure axe:

```javascript
async function runAxe(page) {
  const results = await new AxeBuilder({ page })
    .exclude('#known-issue')  // skip elements
    .disableRules(['color-contrast'])  // disable rules
    .analyze();
  // ...
}
```

### Dynamic Routes

For routes that require state (e.g., session pages), add custom navigation logic:

```javascript
// After auditing static routes...
await page.goto(`${BASE}/prep`);
await page.click('button:has-text("Start")');
await page.waitForURL(/\/session\//);
const result = await runAxe(page);
```

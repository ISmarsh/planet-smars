# Quality Checklists

Pre-completion checklists for code changes. For core principles, see [AGENTS.md](AGENTS.md).

## Security Checklist

Before completing any change, verify:

- [ ] No user input rendered as raw HTML (XSS)
- [ ] No string concatenation in SQL/commands (injection)
- [ ] No secrets in code or logs
- [ ] No overly permissive CORS or auth
- [ ] Dependencies are from trusted sources

## Accessibility Checklist

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

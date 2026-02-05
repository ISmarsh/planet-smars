# Shell & Path Handling

Cross-platform reference for working on Windows with bash-like shells (Git Bash, WSL, MSYS2). For core rules, see [AGENTS.md](AGENTS.md).

## Cross-Platform Paths

- Use Unix-style paths: `/c/Users/name` not `C:\Users\name`
- Forward slashes work universally: `cd /c/Dev/project`
- Avoid Windows path literals in shell commands

## Escaping Pitfalls

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

## Common Fixes

| Issue | Solution |
|-------|----------|
| Path not found (Windows) | Use `/c/path` not `c:\path` |
| Command not found | Check PATH, use full path |
| Unexpected token | Escape special chars (`$`, `` ` ``, `"`) |
| Heredoc issues | Use `<<'EOF'` (quoted) to prevent expansion |
| Unexpected EOF with quoted paths | Trailing `\` before `"` escapes the quote; use PowerShell or forward slashes |

**Trailing backslash issue:** Windows paths ending in `\` cause "unexpected EOF" errors:
```bash
# Bad - \' escapes the closing quote
ls "C:\path\to\dir\"

# Good - use PowerShell for Windows paths
powershell -Command "Get-ChildItem 'C:\path\to\dir'"

# Good - or use forward slashes
ls "C:/path/to/dir/"
```

## PowerShell from Bash

When calling PowerShell from bash-like shells, variable syntax gets mangled:

```bash
# Bad - $_ becomes 'extglob' or similar garbage
powershell -Command "Get-ChildItem | Where-Object { $_.Name -like '*foo*' }"

# Good - avoid inline PowerShell filtering, use simpler commands
powershell -Command "Get-ChildItem -Filter '*foo*'"

# Good - or pipe through bash tools
powershell -Command "Get-ChildItem" | grep foo
```

The `$_` variable (and other `$` variables) in PowerShell commands passed through bash get interpreted by bash first, causing errors like `extglob.Name: command not found`.

**Workarounds:**
- Use PowerShell's parameter-based filtering (`-Filter`, `-Include`) instead of `Where-Object`
- Use simpler PowerShell commands and filter with bash tools (`grep`, `awk`)
- For complex PowerShell logic, write a `.ps1` script file and invoke it

## Cross-Platform Tool Availability

Some Unix tools aren't available by default on Windows:

| Tool | Status | Alternative |
|------|--------|-------------|
| `jq` | Not on Windows Git Bash | Use `--jq` flag with `gh` CLI, or PowerShell's `ConvertFrom-Json` |
| `sed` | Limited in Git Bash | Use dedicated Edit tool or PowerShell |
| `awk` | Limited in Git Bash | Use dedicated tools or scripting |

Prefer tool-native filtering (e.g., `gh api --jq '.field'`) over piping to `jq`.

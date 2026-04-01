# Google Cloud CLI Reference

Patterns and gotchas for `gcloud` on Windows (Git Bash). For core rules, see [AGENTS.md](AGENTS.md).

## Storage Rsync

`gcloud storage rsync` syncs local directories to/from GCS buckets.

### Exclude patterns use regex, not globs

The `--exclude` flag takes **Python regex**, not fnmatch/glob patterns. Using glob syntax like `**` causes a "multiple repeat at position" crash.

```bash
# Wrong - glob syntax, crashes on Windows
gcloud storage rsync src/ gs://bucket/ --exclude='featured/**'

# Right - Python regex
gcloud storage rsync src/ gs://bucket/ --exclude='featured/.*'
```

Multiple excludes require separate flags:

```bash
gcloud storage rsync public/gifs/ gs://bucket/gifs/ \
  --recursive --delete-unmatched-destination-objects \
  --exclude='featured/.*' --exclude='mp4/.*' --exclude='webp/.*'
```

### Syncing subdirectories separately

When subdirectories need different sync behavior (e.g., excluded from parent sync), sync them individually:

```bash
# Sync parent, excluding subdirs
gcloud storage rsync local/ gs://bucket/ --recursive \
  --delete-unmatched-destination-objects \
  --exclude='subdir/.*'

# Sync each subdir to its own GCS path
gcloud storage rsync local/subdir/ gs://bucket/subdir/ \
  --recursive --delete-unmatched-destination-objects
```

### Timeouts in scripts

`gcloud` can hang on network issues. When calling from Node.js or other scripts, set a timeout:

```javascript
execFileSync('gcloud', ['storage', 'rsync', ...args], {
  stdio: 'inherit',
  timeout: 300000,  // 5 minutes
});
```

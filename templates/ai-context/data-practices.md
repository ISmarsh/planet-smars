# Data Practices

Detailed workflows for batch operations, data validation, and external data sourcing. For core principles, see [AGENTS.md](AGENTS.md).

## Disposable Scripts for Batch Operations

When a task requires bulk changes across data files (renaming IDs, wiring cross-references, backfilling fields), write a short disposable script in a scratchpad directory rather than making dozens of manual edits:

- **Read > transform > write** in one pass for consistency
- Print a summary (counts, per-item breakdown, items not found)
- Keep the script outside the repo — it's a tool, not a deliverable
- Delete or leave in scratchpad after use; don't commit it

This avoids error-prone repetitive edits and produces an auditable log of what changed.

## Verify-Iterate Cycle

After bulk changes or cross-cutting edits, run validation before committing:

1. Make the change (script, batch edit, refactor)
1. Run validation (audit script, build, lint, tests)
1. If issues found, fix and re-validate
1. Repeat until clean

Don't skip the re-validation step after fixes — secondary changes often introduce new issues (e.g., fixing a broken reference reveals a missing field elsewhere).

## Data Integrity Auditing

For projects with cross-referenced data files (e.g., entities referencing each other by ID), write an audit script that checks:

- **Broken references** — IDs that don't resolve to existing records
- **Bidirectional consistency** — if A references B, does B reference A back?
- **Missing fields** — required or expected data that's empty
- **Format validation** — IDs, dates, enums match expected patterns
- **Duplicates** — repeated IDs or conflicting records

Run the audit as part of the verify-iterate cycle. Keep the script in a scratchpad (or commit it as a dev tool if it'll be reused across sessions).

## Data Porting from External Sources

When transcribing data from APIs, reference docs, or databases into project files, a different class of errors emerges than with cross-references. Run the manual content review checklist from AGENTS.md ("Pre-commit verification"), plus:

- **Cross-reference with source** — spot-check a sample against original data

These errors are especially common with large tables transcribed from search results or API responses, where items can be miscategorized or duplicated across query batches.

## External Data Sourcing

When gathering data from external sources, prefer structured APIs over web scraping:

- **APIs first** — REST, GraphQL, Elasticsearch endpoints return clean, structured data that's easier to validate and transform
- **Scraping is fragile** — sites frequently block automated requests (403), change markup structure, or require authentication
- **Search for API alternatives** — many sites with restrictive frontends expose public APIs, data dumps, or partner endpoints (e.g., Wikimedia Commons API instead of scraping a wiki frontend)
- **Cache API responses** — store raw responses in scratchpad during research to avoid re-querying and hitting rate limits

## Tiered Research for Large Tasks

When a task involves gathering information about many items (characters, APIs, dependencies), avoid trying to research everything at once:

1. **Categorize** items by importance or complexity (e.g., tier 1 = essential, tier 2 = important, tier 3 = nice-to-have)
1. **Present tiers** to the user and let them choose scope
1. **Parallelize** research within a tier using multiple agents when possible
1. **Validate** each batch before starting the next

This prevents wasted effort on low-priority items and gives the user control over how deep to go.

When parallelizing with subagents, verify completeness of each agent's output before incorporating results. Agent outputs can be truncated, incomplete, or require follow-up queries. Spot-check that returned data covers the expected scope before writing it into project files.

## Licensed Data Attribution

When a project includes data under Creative Commons or similar copyleft licenses:

- **Preserve attribution** — keep `attribution` blocks in data files intact
- **Note modifications** — track what transformations were applied (cleaning, normalization, enrichment)
- **ShareAlike** — adapted material stays under the same or compatible license
- **Keep license files** — maintain a `LICENSE-DATA` or equivalent documenting per-source obligations
- **Separate code from data** — application code can use a different license (MIT, etc.) when data is displayed as a "collection" rather than "adaptation"

<!-- AI-DOC: owner=documentation; verified=2026-07-18; sources=AGENTS.md,docs/ai-maintenance/entry.md,scripts/verify-docs.mjs -->
# Living documentation creation guide

These documents are a low-token navigation system, not a second copy of the
source code. Evidence ranks as executable results, current source/config,
tests, living documentation, then history.

Create a feature index only when a real domain has an independent entry,
contract, invariants, tests, or maintenance risk. Each page starts with
`AI-DOC` metadata, has one clear reader task, links from an existing route, and
uses repository-relative paths plus stable symbols rather than line numbers.

One fact has one authoritative page. Save stable architecture, contracts,
risks, verification, and search terms. Keep conversations, temporary plans,
debug output, and rejected options in issues or task notes.

Run `npm run docs:verify`, then manually confirm three common tasks can reach
their source and verification method within two links from the entry.

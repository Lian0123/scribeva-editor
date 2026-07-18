<!-- AI-DOC: owner=documentation; verified=2026-07-18; sources=scripts/verify-docs.mjs,docs/ai-maintenance -->
# Documentation maintenance

For each delivered change:

1. List changed contracts and source areas.
2. Find their authority through the feature map.
3. Verify new claims against source, tests, and command results.
4. Update existing authority pages instead of creating synonyms.
5. Change `verified` only on pages actually re-checked.
6. Add the changelog only for user-visible or maintenance-visible delivery.
7. Run `npm run docs:verify`.

Never describe a roadmap item as implemented. Use “proposal” or “not yet
implemented” when evidence is absent.

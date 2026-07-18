<!-- AI-DOC: owner=maintainers; verified=2026-07-18; sources=tsconfig.json,src,AGENTS.md -->
# Development standards

- Use strict TypeScript and explicit public contracts.
- `core` owns portable state/history, `security` owns import/export policy,
  `browser` owns DOM input and commands, and `ui` owns presentation.
- Framework-specific behavior does not enter the main package.
- Public API changes go through `src/public-api.ts` and semantic versioning.
- Browser events must handle composition without duplicate transactions.
- HTML from external or editable DOM sources goes through the sanitizer.
- Add abstractions only for a real second use or clear test boundary.
- Keep source, filenames, tests, and living documentation in English.
- Do not add a runtime dependency without an ADR and audit.

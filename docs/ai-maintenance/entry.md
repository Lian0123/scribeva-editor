<!-- AI-DOC: owner=maintainers; verified=2026-07-18; sources=package.json,src/public-api.ts,src/ui/editor-shell.ts -->
# AI maintenance entry

This is the first stop for maintainers and AI agents. It routes tasks to the
smallest trustworthy source set.

## 30-second project summary

Scribeva is a framework-independent TypeScript HTML editor published as
`scribeva-editor`. The browser editing engine uses Selection/Range and
composition/clipboard events. A sanitized HTML snapshot and structured JSON
document form the portable data contract. The Word-inspired UI is built with
native DOM and CSS design tokens. The package is MIT licensed and has no
runtime dependencies.

## Task routes

| Task | Read first | Read if needed |
|---|---|---|
| Understand the project | [Project facts](key-memory/project-facts.md) | [Feature map](quick-navigation/feature-map.md) |
| Install, build, or publish | [Installation and configuration](installation-and-configuration.md) | [Testing](testing-and-verification.md) |
| Change document state or commands | [Editor core](quick-navigation/editor-core.md) | [Risks](key-memory/risks-and-technical-debt.md) |
| Change typing, selection, IME, or paste | [Browser input](quick-navigation/browser-input.md) | [HTML security](quick-navigation/html-security-and-serialization.md) |
| Change sanitizer or HTML/JSON output | [HTML security](quick-navigation/html-security-and-serialization.md) | [Testing](testing-and-verification.md) |
| Change Ribbon, dialogs, themes, or locale | [UI and theming](quick-navigation/ui-and-theming.md) | [Development standards](development-standards.md) |
| Change official site or GitHub Pages | [Installation and configuration](installation-and-configuration.md) | [UI and theming](quick-navigation/ui-and-theming.md) |
| Change fonts, CSP, Blob URLs, or external guidance | [External references](external-references/reference-index.md) | [HTML security](quick-navigation/html-security-and-serialization.md) |
| Fix a bug or add a feature | [Task workflow](task-processing/task-workflow.md) | [Change decisions](decision-process/change-decision-flow.md) |
| Update living documentation | [Documentation maintenance](documentation-maintenance.md) | [Progressive reading](reading-strategy/progressive-reading.md) |

## Fixed completion loop

Locate with this table, verify source and tests, make the smallest complete
change, run the relevant verification matrix, update affected living
documents, and re-index codebase-memory after structural changes.

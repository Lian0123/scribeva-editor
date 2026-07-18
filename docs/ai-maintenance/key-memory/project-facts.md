<!-- AI-DOC: owner=maintainers; verified=2026-07-18; sources=package.json,src/public-api.ts,src,tests -->
# Project facts

| Area | Verified fact |
|---|---|
| Package | `scribeva-editor` version 0.0.1, MIT |
| Runtime | Browser-native TypeScript, zero runtime dependencies |
| Output | ESM, CJS, declarations, CSS, and sourcemaps |
| API | Imperative factory plus optional Custom Element registration |
| State | Sanitized HTML and semantic JSON with snapshot history |
| UI | Native DOM Word-inspired Ribbon with zh-TW, English, Japanese, and a line-numbered HTML source workspace |
| Security | HTML/style/URL allowlist and Office paste cleanup |
| Media | URL and Blob images, emoji picker, sanitized preview |
| Tables | Insert, row/column operations, headers, merge/split, delete, vertical alignment, directional/all/no-border controls |
| Website | Three-language forest-green product site with layered GSAP motion, SEO, direct `file://` bundle, and GitHub Pages output |
| Tests | Vitest/jsdom with enforced coverage plus Playwright browser specifications |

Data flow: `createEditor` → `EditorShell` → `EditorEngine` → `DocumentModel`.
External HTML flows through `sanitizeHTML`; HTML and JSON convert through
`htmlToJSON` and `jsonToHTML`.

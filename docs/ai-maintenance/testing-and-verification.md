<!-- AI-DOC: owner=quality; verified=2026-08-01; sources=package.json,vitest.config.ts,playwright.config.ts,tests -->
# Testing and verification

| Change | Minimum verification | Additional verification |
|---|---|---|
| Documentation only | `npm run docs:verify` | Navigate links manually |
| Core or security | `npm run typecheck`, `npm test` | Malicious/paste corpus |
| Browser input or command | Above | `npm run test:e2e` on three engines |
| UI or theme | Above | Browser screenshots, keyboard and responsive checks |
| Package or exports | `npm run check`, `npm pack --dry-run` | Install tarball in a clean fixture |
| Dependency/tooling | Full check and `npm audit` | License and Node-version review |

Tests observe contracts rather than private implementation. A bug fix includes
a regression case. Report commands actually run and explain omitted browser or
manual checks.

Typography, table-width, Unicode picker, and column-layout specifications
cover synchronized presets and validated custom values, selection restoration,
custom emoji, mathematical symbols, computed column layout, sanitizer
preservation, and HTML/JSON round trips. Zoom specifications verify the
canvas geometry changes and that the 100% reset restores both control state
and status output. UI specifications also assert that custom numeric entry is
hidden until selected, directional table actions render SVG rather than visible
text, and every icon retains a localized accessible name.

Vitest coverage is a required gate: statements and lines 90%, functions 85%,
and branches 70%. Browser specifications cover Ribbon interaction, undo/redo
shortcuts, validation-free dialog cancellation, emoji/preview flows, locale
switching, Blob image upload, responsive layout, and the Chromium visual
baseline. Release verification runs Chromium, Firefox, and WebKit.

HTML source specifications cover line numbering, source sanitization,
Ctrl/Command+S, visual/source tab synchronization, and history restoration.
Table specifications exercise every directional border preset and verify
computed no-border behavior in a real browser.

View and template specifications assert the three-section settings layout,
nine localized template cards, preview selection, sanitized undoable
application, and default page-break visibility. Print tests verify that a
separate tab is opened, `window.opener` is severed, sanitized document content
and localized controls are created there, Print/Close work, and the host page
never receives print-only classes or portal markup.

Website checks also open the absolute `file://.../demo/index.html` path, assert
zero console/page errors, and switch English/Japanese example documents.
Metadata tests cover description, Open Graph image, canonical URL, and
SoftwareApplication JSON-LD. Table Ribbon tests verify computed border and fill
styles, fractional custom-width serialization, and clear localized action
names on icon-only controls.

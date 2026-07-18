<!-- AI-DOC: owner=maintainers; verified=2026-07-18; sources=src,tests -->
# Feature map

| Domain | Authority | Primary source |
|---|---|---|
| State, history, plugins, commands | [Editor core](editor-core.md) | `src/core`, `src/browser/commands.ts` |
| Input, selection, composition, clipboard | [Browser input](browser-input.md) | `src/browser/editor-engine.ts` |
| Sanitizer and HTML/JSON | [HTML security](html-security-and-serialization.md) | `src/security` |
| Ribbon, dialogs, status, locale, themes | [UI and theming](ui-and-theming.md) | `src/ui`, `src/locales`, `src/styles.css` |
| Official site, playground, GitHub Pages | [Installation](../installation-and-configuration.md) | `demo`, `vite.demo.config.ts`, `.github/workflows/pages.yml` |
| Package API | [Editor core](editor-core.md) | `src/public-api.ts`, `package.json` |

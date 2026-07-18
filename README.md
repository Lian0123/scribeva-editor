# Scribeva Editor

[繁體中文](https://github.com/Lian0123/scribeva-editor/README.zh-TW.md) · **English** · [日本語](https://github.com/Lian0123/scribeva-editor/README.ja.md)

Scribeva is a framework-independent, MIT-licensed HTML editor with a polished
Word-inspired interface. It ships as one npm package and currently has zero
runtime dependencies.

## Install

```bash
npm install scribeva-editor
```

```ts
import { createEditor } from "scribeva-editor";
import "scribeva-editor/styles.css";

const editor = createEditor(document.querySelector("#editor")!, {
  locale: "zh-TW",
  theme: "light",
  placeholder: "Start writing…",
  initialHTML: "<h1>Hello</h1><p>Portable HTML.</p>",
  onChange: ({ html, json }) => {
    console.log(html, json);
  },
});
```

## Capabilities

- Word-inspired Home, Insert, View, and HTML editing ribbons
- Headings, inline formatting, colors, alignment, indentation, and lists
- Links, images, tables, dividers, code blocks, and block quotes
- HTML allowlist sanitizer and Microsoft Office paste cleanup
- Deterministic HTML and structured JSON import/export
- Undo/redo history, keyboard shortcuts, clipboard, and IME-aware input
- Traditional Chinese, English, and Japanese UI
- Light, dark, and system themes through CSS design tokens
- Emoji picker, document preview, and Blob image insertion
- Table row/column operations, headers, merge/split, vertical alignment,
  directional/all/no-border presets, outline/grid styles, border color, and
  cell fills
- Sanitized HTML source mode with line numbers, line/column status, indentation,
  wrapping, apply/revert controls, and Ctrl/Command+S
- Imperative API, Custom Element registration, and plugin commands

## Public API

```ts
editor.getHTML();
editor.setHTML("<p>Updated</p>");
editor.getJSON();
editor.setJSON(document);
editor.focus();
editor.setReadOnly(true);
editor.insertImageBlob(file, "Product screenshot");
editor.exec("bold");
editor.destroy();
```

Custom commands can be registered without modifying the core:

```ts
const unregister = editor.registerCommand("insertProduct", (context, product) => {
  context.setHTML(`<p>${String(product)}</p>`, "command");
  return true;
});
```

## Custom Element

```ts
import { defineScribevaElement } from "scribeva-editor";
import "scribeva-editor/styles.css";

defineScribevaElement();
```

```html
<scribeva-editor locale="en" theme="system">
  <p>Initial content</p>
</scribeva-editor>
```

## Security boundary

Scribeva sanitizes imported and pasted HTML in the browser. Applications must
still enforce authorization and sanitize untrusted HTML on the server before
storage or rendering. See [SECURITY.md](https://github.com/Lian0123/scribeva-editor/SECURITY.md).

### Content Security Policy

Scribeva does not require remote scripts, remote fonts, workers, frames, or
network connections. Import the distributed CSS file from your own bundle.
A practical starting policy is:

```http
Content-Security-Policy:
  default-src 'none';
  script-src 'self';
  style-src-elem 'self';
  style-src-attr 'unsafe-inline';
  img-src 'self' https: blob:;
  font-src 'self';
  connect-src 'self';
  object-src 'none';
  base-uri 'none';
  form-action 'self';
  frame-ancestors 'none';
```

Why `style-src-attr 'unsafe-inline'`? Rich-text formatting such as color,
alignment, font family, size, and table-cell vertical alignment is represented
as allowlisted inline style attributes in portable HTML. This directive is
separate from `style-src-elem`, so external stylesheets can remain restricted
to `'self'`. If your application disables style attributes entirely, omit
these formatting features or transform Scribeva output into application-owned
classes before rendering.

`blob:` in `img-src` is required only when using `insertImageBlob()`. Blob URLs
are local and temporary; Scribeva revokes the URLs it creates when the editor
is destroyed. Upload durable images to application storage before persisting
the document. Add exact CDN origins instead of broadening `img-src` when remote
images are allowed.

Treat this as a starting point and merge it with your application's existing
policy. Test in report-only mode before enforcement. See MDN's
[`style-src-attr`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src-attr)
and [`default-src`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/default-src)
references.

## Fonts and licensing

Scribeva uses only the open-source Noto Sans, Noto Serif, and Noto Sans Mono
families in its named font stacks, and recommends Noto Color Emoji when a
self-hosted emoji font is needed. It does not download or redistribute font files.
Applications that need identical rendering on every platform should self-host
the relevant Noto files and retain their SIL Open Font License notices. The
generic `sans-serif`, `serif`, `monospace`, and `emoji` families remain
fallbacks.

## Website and GitHub Pages

The official website and live playground are in `demo/` and use relative asset
paths so they work under a GitHub Pages repository subpath.

```bash
npm run build:site
npm run preview:site
```

The generated `demo-dist/` contains `index.html`, a Pages-compatible
`404.html`, and `.nojekyll`. The included `.github/workflows/pages.yml` runs
quality checks, builds the website, and deploys it after Pages is configured to
use GitHub Actions.

`npm run build:site` also writes a classic browser bundle to `demo/assets/`.
After building, `demo/index.html` can be opened directly with `file://` without
a server, ES-module CORS, or TypeScript loading. The website uses GSAP as a
build-time-only animation dependency; it is not part of the npm package. See
[THIRD_PARTY_NOTICES.md](https://github.com/Lian0123/scribeva-editor/THIRD_PARTY_NOTICES.md).

## Development

```bash
nvm use
npm install
npm run dev
npm run check
npm run test:coverage
npm run test:e2e
```

The AI-oriented living documentation starts at
[docs/ai-maintenance/entry.md](https://github.com/Lian0123/scribeva-editor/docs/ai-maintenance/entry.md).

## Current status

Version `0.0.1` is a functional foundation. Core formatting, serialization,
sanitization, table operations, themes, dialogs, and package output are
implemented. Image resize/crop, durable upload adapters, framework wrappers,
and real-time collaboration remain future work.

## License

[MIT](https://github.com/Lian0123/scribeva-editor/LICENSE)

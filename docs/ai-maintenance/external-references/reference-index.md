<!-- AI-DOC: owner=documentation; verified=2026-07-18; sources=PLAN.md,package.json,README.md,src/styles.css -->
# External reference index

External sources must record URL, retrieval date, applicable version, concise
project-relevant conclusion, and affected contract. Prefer standards,
browser/vendor documentation, official release notes, and original authors.

| Source | Retrieved | Version/scope | Project conclusion | Affected contract |
|---|---|---|---|---|
| [Noto CJK repository](https://github.com/notofonts/noto-cjk) and [SIL Open Font License 1.1](https://github.com/googlefonts/noto-cjk/blob/main/Sans/LICENSE) | 2026-07-18 | Noto Sans/Serif CJK repository license | Noto families are open-source and commercially usable subject to the OFL; Scribeva references but does not redistribute font binaries. | Font controls, CSS fallback stacks, README licensing guidance |
| [Noto distribution licensing](https://github.com/notofonts/notofonts.github.io) | 2026-07-18 | Noto project distribution guidance | Noto fonts are distributed under SIL OFL; consumers remain responsible for serving chosen files and notices. | Consumer font hosting guidance |
| [Noto Emoji repository](https://github.com/googlefonts/noto-emoji) and [license](https://github.com/googlefonts/noto-emoji/blob/master/LICENSE) | 2026-07-18 | Noto Emoji OFL 1.1 | Emoji characters may use an OFL Noto Emoji font supplied by the consumer or platform emoji fallback. | Emoji UI and font guidance |
| [MDN `style-src-attr`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src-attr) | 2026-07-18 | CSP Level 3 | Scribeva serializes allowlisted inline style attributes, so a strict deployment must explicitly choose a `style-src-attr` policy. | README CSP example |
| [MDN `default-src`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/default-src) | 2026-07-18 | CSP reference | Start from a restrictive fallback and grant only editor-required resource types. | README CSP example |
| [MDN `URL.revokeObjectURL`](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static) | 2026-07-18 | Browser Blob URL lifecycle | Blob URLs must be revoked; Scribeva revokes editor-owned URLs on destroy and documents their session-local nature. | `insertImageBlob`, lifecycle guidance |
| [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) and [publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) | 2026-07-18 | GitHub Pages Actions | The demo is built with relative asset paths and deployed from `demo-dist` through the official Pages actions. | `.github/workflows/pages.yml`, `build:site` |
| [GSAP repository](https://github.com/greensock/GSAP) and [standard no-charge license](https://gsap.com/standard-license) | 2026-07-18 | GSAP 3.15.0 | GSAP and ScrollTrigger may be bundled into the separate official website for commercial use under GreenSock's terms. They are a development dependency, retain their license banner, and are excluded from the MIT npm tarball. | `demo/main.ts`, generated website bundle, `THIRD_PARTY_NOTICES.md` |

No package named `scribeva-editor` was found in the npm registry lookup on
2026-07-18; this is not a trademark opinion or name reservation.

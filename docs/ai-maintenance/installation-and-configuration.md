<!-- AI-DOC: owner=tooling; verified=2026-07-18; sources=package.json,tsconfig.json,vite.config.ts,playwright.config.ts -->
# Installation and configuration

Requirements: Node.js 18 or newer and npm. Node.js 22 LTS is the contributor
default recorded in `.nvmrc`. Install with `npm install`.

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite playground on port 4173 |
| `npm run typecheck` | Strict TypeScript validation |
| `npm test` | jsdom unit and integration tests |
| `npm run test:coverage` | Tests with enforced 90% line/statement, 85% function, 70% branch floors |
| `npm run test:e2e` | Playwright browser tests |
| `npm run docs:verify` | Living-document and license policy checks |
| `npm run build` | ESM, CJS, CSS, sourcemaps, and declarations |
| `npm run build:site` | Classic `file://` bundle in `demo/assets` plus `demo-dist` for GitHub Pages |
| `npm run check` | Required non-browser verification |

Published files are controlled by `package.json.files` and `exports`. Runtime
dependencies are empty. Consumer code imports `scribeva-editor` and
`scribeva-editor/styles.css`.

The Pages workflow builds `demo-dist`, uploads it as the Pages artifact, and
deploys only from `main`. Repository settings must select GitHub Actions as the
Pages source.

After `npm run build:site`, opening `demo/index.html` directly must load
`demo/assets/site.js` as a classic script and `site.css` without a server.
Never restore a direct `main.ts` or `type="module"` reference in that file.

# Scribeva agent instructions

## First read

Start every maintenance task at `docs/ai-maintenance/entry.md`. Read only the
task route and the relevant feature index before opening source files.

## Code discovery

This repository uses codebase-memory MCP. Prefer graph tools in this order:

1. `search_graph` for functions, classes, routes, and variables.
2. `trace_path` for callers, callees, data flow, and impact analysis.
3. `get_code_snippet` after finding the exact qualified name.
4. `query_graph` for complex relationships and hotspots.
5. `get_architecture` for a high-level map.

Use text search only for literals, error messages, configuration, Markdown,
CSS, or when the graph has insufficient coverage. Re-index after structural
changes and before a release.

## Change workflow

1. State the observable goal, non-goals, affected contract, and risks.
2. Find the current source and tests; do not treat roadmap text as implemented.
3. Add or update a behavior-focused test.
4. Implement the smallest complete vertical slice.
5. Run the verification matrix in
   `docs/ai-maintenance/testing-and-verification.md`.
6. Update only the living documents affected by the change.
7. Update `verified` dates only for pages actually re-checked.

## Project constraints

- Keep the published package framework-independent.
- Runtime dependencies are zero by default. Adding one requires an ADR,
  license review, security review, and bundle impact measurement.
- Do not use `document.execCommand` as the editing core.
- Preserve the HTML allowlist, URL policy, and deterministic serializer.
- Treat selection, composition/IME, clipboard, history, and accessibility as
  public behavior.
- Public exports follow semantic versioning. Do not expose internal classes
  from `src/public-api.ts` without an explicit API decision.
- Source code, filenames, and living documentation are written in English.

<!-- AI-DOC: owner=editor-core; verified=2026-07-18; sources=src/core,src/browser/commands.ts,src/public-api.ts,tests/document-model.test.ts -->
# Editor core

`DocumentModel` owns sanitized HTML, structured JSON, snapshots, and history.
`EditorEngine` adapts the model to one contenteditable element. Default command
factories in `createDefaultCommands` modify the current DOM selection and call
`commit`.

Table commands operate on the cell containing the current Range. They cover
row/column insertion and removal, header-row conversion, merge-right, split,
table deletion, and top/middle/bottom vertical alignment. `insertText` is the
generic character insertion path used by the emoji picker.

Table formatting commands apply outline and internal grid color, width, and
style to the table and every cell. Cell fill applies to the active cell.
Clearing formatting removes only table-owned border/fill properties.
`tableBorders` applies top, bottom, left, right, paired outer edges, all cell
edges, or zero-width no-border styling using the current Ribbon color, width,
and line style.

Public entry points are `createEditor`, `defineScribevaElement`, model and
serializer helpers, locale registration, and public types in
`src/public-api.ts`.

Invariants:

- Stored HTML is sanitized.
- JSON is a detached clone when read.
- Identical content does not create a history entry.
- A typing burst checkpoints as one undo unit.
- A command returns false when it cannot act.
- Blob image URLs are owned and revoked by the editor shell.
- Internal UI classes are not public API.

Search terms: `DocumentModel`, `EditorEngine`, `createDefaultCommands`,
`createEditor`, `registerCommand`, `EditorPlugin`.

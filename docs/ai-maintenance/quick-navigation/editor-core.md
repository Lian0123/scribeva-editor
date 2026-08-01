<!-- AI-DOC: owner=editor-core; verified=2026-08-01; sources=src/core,src/browser/commands.ts,src/public-api.ts,tests/document-model.test.ts,tests/commands.test.ts -->
# Editor core

`DocumentModel` owns sanitized HTML, structured JSON, snapshots, and history.
`EditorEngine` adapts the model to one contenteditable element. Default command
factories in `createDefaultCommands` modify the current DOM selection and call
`commit`.

Table commands operate on the cell containing the current Range. They cover
row/column insertion and removal, whole-column reordering, header-row
conversion, merge-right, split, table deletion, reader-sortability metadata,
and top/middle/bottom vertical alignment. Column reordering rejects merged
cell grids because their visual column coordinates are ambiguous. `insertText` is the
generic Unicode character insertion path used by the emoji and
mathematical-symbol pickers. Font-size and line-height commands validate
custom numeric values before applying styles. The `columns` command wraps the
selected top-level block range in a persistent `scribeva-columns` container;
one column unwraps an existing container.

`pageBreak` inserts a sanitized `hr.scribeva-page-break` plus a following
paragraph so editing can continue. CSS renders the marker on screen and maps
it to a real print page break.

Built-in templates are trusted UI definitions, but applying one still uses the
normal `EditorEngine.setHTML(..., "command")` path. This makes replacement a
sanitized, observable, undoable document operation rather than a direct DOM
write.

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

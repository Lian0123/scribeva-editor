<!-- AI-DOC: owner=browser-engine; verified=2026-07-18; sources=src/browser/editor-engine.ts,src/browser/commands.ts,tests/e2e/editor.spec.ts -->
# Browser input

`EditorEngine.#bindEvents` handles input, composition, paste, and keyboard
shortcuts. Composition starts suppress normal input commits and composition end
commits one final snapshot. Paste prefers HTML, normalizes Office metadata,
sanitizes it, inserts a fragment at the current Range, and commits with source
`paste`.

Typing commits update the current document without immediately pushing a
snapshot. A 500 ms idle checkpoint groups a typing burst into one undo unit.
Explicit commands, API writes, paste, undo, and redo flush a pending checkpoint.
`beforeinput` history types plus Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, and Ctrl/Cmd+Y
route through the same model history. Command commits retain the live DOM
selection and avoid unnecessary contenteditable rerenders.

Commands use Selection/Range and nearest supported block elements.
`document.execCommand` is not the editing core.

High-risk changes include collapsed selection formatting, selections spanning
multiple blocks, list transformations, IME sequencing, and custom history
grouping. Verify them in Chromium, Firefox, and WebKit.

Search terms: `selectionWithin`, `wrapRange`, `toggleList`, `checkpoint`,
`historyUndo`, `compositionstart`, `compositionend`, `#insertFragment`.

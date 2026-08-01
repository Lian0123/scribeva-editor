<!-- AI-DOC: owner=design-system; verified=2026-08-01; sources=src/ui,src/locales,src/styles.css,demo -->
# UI and theming

`EditorShell` creates the title bar, tabs, Home/Insert/Templates/View ribbons, document
canvas, status bar, and native dialog. It delegates document behavior to
`EditorEngine`. Toolbar mousedown captures the current Range so dialogs and
controls can restore it before a command.

The HTML editing tab replaces the page canvas with a dependency-free source
workspace. It provides synchronized line numbers, caret line/column status,
Tab and Shift+Tab indentation, optional wrapping, apply/revert controls, and
Ctrl/Command+S. Applying or leaving the tab commits through `EditorEngine`
with source `command`, so sanitizer, change events, and undo/redo remain the
same document contract.

Themes are scoped under `.scribeva` in the `scribeva` CSS layer. Public design
tokens use the `--scribeva-` prefix. `data-theme` selects light, dark, or
system. Locale dictionaries are typed against the same shape and ship for
Traditional Chinese, English, and Japanese.

Font size, line height, and table border width use the same paired value
control. The validated numeric input stays hidden for preset values and opens,
focuses immediately after the select on the same row, and remains synchronized
only when the user selects the localized custom-value option. The paragraph
group also applies one- through four-column
layouts to the selected top-level blocks.

The Insert tab includes URL images, Blob-backed local image upload, tables
with grouped directional row/column and structure icons, reader-sortable
tables, drag-to-reorder header columns, an expanded emoji picker with
custom Unicode entry, mathematical symbols, horizontal separators, and
print-aware page breaks. Table action
icons show the insertion edge or deletion axis while localized tooltips and
accessible names preserve the full command wording. View includes a sanitized
document preview and an opt-in sticky toolbar that remains at the viewport edge
while a long editor is scrolled. Its top offset accommodates fixed site headers;
its bottom reserve limits toolbar height above fixed footers, and the editor root
remains the natural sticky boundary. Page-break markers are visible by default
and can be hidden without changing stored HTML. Native
dialog cancellation uses a non-submit button and the dialog `cancel` event;
only an affirmative form submit performs required-field validation. Font
controls and CSS reference Noto Sans, Noto Serif, Noto Sans Mono, generic
fallbacks, and platform emoji only. Font files are external consumer assets.

The Templates tab ships nine dependency-free starter documents: executive
brief, project proposal, editorial newsletter, meeting notes, brand manifesto,
launch command center, customer case study, workshop canvas, and campaign
concept. Cards use distinct visual cues and update an inline preview before
application. Applying a template replaces the current document through
`EditorEngine` with source `command`, so sanitization, change events, and undo
remain intact.

View controls are grouped into document, scrolling, and output sections rather
than one flat tool row. Printing synchronously opens a separate `about:blank`
tab from the user gesture, severs `window.opener`, and constructs a localized
print-ready document using DOM APIs. The source editor page is never mutated or
restyled. The print tab contains only sanitized editor HTML, dedicated screen
and print CSS, explicit Print and Close controls, and real page-break behavior.

The official site uses a forest-green editorial system, warm-paper surfaces,
and layered GSAP/ScrollTrigger motion: staged hero construction, document
parallax, reading progress, section choreography, and editor/detail reveals,
all with a reduced-motion escape. Its
classic IIFE bundle is copied to `demo/assets`, allowing `demo/index.html` to
run directly from `file://`. The same source produces `demo-dist` for Pages.
SEO includes localized metadata, Open Graph/Twitter tags, SoftwareApplication
JSON-LD, canonical/alternate links, robots, sitemap, manifest, and a branded
social card.

Document zoom uses layout-aware CSS zoom from 70% to 140%, with slider,
increment/decrement buttons, a one-click 100% reset, synchronized status
output, and horizontal workspace overflow when the scaled canvas is wider
than its viewport.

Verify active command state, focus visibility, dialog keyboard behavior,
compact layout, dark mode, read-only mode, print output, and reduced motion.

Search terms: `EditorShell`, `#bindUI`, `#openDialog`, `#captureSelection`,
`insertImageBlob`, `getLocale`, `--scribeva-`.

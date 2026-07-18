<!-- AI-DOC: owner=design-system; verified=2026-07-18; sources=src/ui,src/locales,src/styles.css,demo -->
# UI and theming

`EditorShell` creates the title bar, tabs, Home/Insert/View ribbons, document
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

The Insert tab includes URL images, Blob-backed local image upload, tables,
emoji, and separators. View includes a sanitized document preview. Native
dialog cancellation uses a non-submit button and the dialog `cancel` event;
only an affirmative form submit performs required-field validation. Font
controls and CSS reference Noto Sans, Noto Serif, Noto Sans Mono, generic
fallbacks, and platform emoji only. Font files are external consumer assets.

The official site uses a forest-green editorial system, warm-paper surfaces,
and layered GSAP/ScrollTrigger motion: staged hero construction, document
parallax, reading progress, section choreography, and editor/detail reveals,
all with a reduced-motion escape. Its
classic IIFE bundle is copied to `demo/assets`, allowing `demo/index.html` to
run directly from `file://`. The same source produces `demo-dist` for Pages.
SEO includes localized metadata, Open Graph/Twitter tags, SoftwareApplication
JSON-LD, canonical/alternate links, robots, sitemap, manifest, and a branded
social card.

Verify active command state, focus visibility, dialog keyboard behavior,
compact layout, dark mode, read-only mode, print output, and reduced motion.

Search terms: `EditorShell`, `#bindUI`, `#openDialog`, `#captureSelection`,
`insertImageBlob`, `getLocale`, `--scribeva-`.

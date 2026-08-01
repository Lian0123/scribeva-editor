<!-- AI-DOC: owner=security; verified=2026-08-01; sources=src/security,tests/sanitizer.test.ts,tests/serializer.test.ts,SECURITY.md -->
# HTML security and serialization

`sanitizeHTML` parses input into a separate HTML document, drops dangerous
elements and executable attributes, unwraps unknown safe containers, filters
styles, validates URLs, and serializes attributes deterministically.
`normalizePastedHTML` removes common Microsoft Office metadata before
sanitization.

HTML source mode uses the same `EditorEngine.setHTML` path as the public API;
scripts, event handlers, and unsupported markup are removed when the user
applies source or leaves the HTML tab. Directional table borders use explicitly
allowlisted top/right/bottom/left color, style, and width longhands.
Persistent column containers use an allowed `div.scribeva-columns` with
allowlisted `column-count` and `column-gap` styles. The serializer maps that
class to the semantic `columns` JSON node so nested blocks round-trip without
flattening.

Reader sorting is enabled only by the exact table attribute
`data-scribeva-sortable="true"`; other values are discarded. Page breaks reuse
the already allowlisted `hr.scribeva-page-break` marker and round-trip through
the deterministic serializer.

`htmlToJSON` maps allowed DOM to a semantic document tree. `jsonToHTML` maps the
tree back through the sanitizer. Browser sanitization is not a replacement for
server authorization and sanitization.

Security invariants:

- No script, iframe, SVG, inline event handler, or dangerous URL scheme.
- Only allowlisted CSS properties without URL/expression/import values.
- New-tab links receive `noopener noreferrer`.
- New elements, attributes, or URL schemes require security tests.

Search terms: `ALLOWED_TAGS`, `DROP_CONTENT_TAGS`, `sanitizeUrl`,
`sanitizeStyle`, `sanitizeNode`, `htmlToJSON`, `jsonToHTML`.

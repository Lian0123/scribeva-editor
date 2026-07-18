<!-- AI-DOC: owner=security; verified=2026-07-18; sources=src/security,tests/sanitizer.test.ts,tests/serializer.test.ts,SECURITY.md -->
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

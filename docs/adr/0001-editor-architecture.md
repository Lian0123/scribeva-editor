# ADR 0001: Editor architecture

Status: Accepted on 2026-07-18.

Scribeva separates portable state (`core`), content policy (`security`),
browser interaction (`browser`), and visual controls (`ui`). Sanitized HTML and
semantic JSON are public data formats. Browser DOM is an input/rendering
adapter, not the only source of truth. The package exposes an imperative
factory and optional Custom Element rather than depending on a UI framework.

This creates more responsibility for selection and rendering behavior but
keeps the package portable and testable.

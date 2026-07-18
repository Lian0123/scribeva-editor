<!-- AI-DOC: owner=maintainers; verified=2026-07-18; sources=AGENTS.md,docs/ai-maintenance/key-memory/risks-and-technical-debt.md -->
# Change decision flow

- Bug: reproduce, fix closest to the cause, add a regression test.
- Feature: define input, output, errors, lifecycle, and public contract first.
- Refactor: preserve external behavior and proceed under tests.
- Dependency/tooling: review release notes, Node support, license, audit, and
  published bundle impact.
- Documentation: update from verified evidence, not aspiration.

Check public exports, HTML/JSON schema, sanitizer policy, selection and IME,
locale shape, CSS tokens, package exports, consumer installation, tests, and
living-document routes. Prefer root-cause fixes and avoid unrelated renaming,
formatting, or tool upgrades.

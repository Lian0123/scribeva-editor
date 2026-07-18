<!-- AI-DOC: owner=maintainers; verified=2026-07-18; sources=src/browser,src/security,package.json,PLAN.md -->
# Risks and technical debt

| Level | Observable risk | Direction |
|---|---|---|
| High | Inline commands do not yet fully normalize selections across multiple blocks | Add range fixtures and transaction-level transforms |
| High | Sanitizer is client-side and intentionally conservative | Maintain malicious corpus; require server-side defense |
| Medium | Table resize handles and keyboard grid navigation are not implemented | Add accessible grid navigation before claiming spreadsheet parity |
| Medium | Blob image URLs are session-local and do not survive persisted HTML | Require consumers to upload/replace Blob URLs before durable storage |
| Medium | Image resize/crop and async upload adapters are not implemented | Add an explicit adapter contract without adding runtime dependencies |
| Medium | History is snapshot-based and typing is grouped by a fixed 500 ms idle window | Consider configurable semantic transactions for very large documents |
| Medium | The separate website bundle includes GSAP under GreenSock's license, not MIT | Keep it out of `package.json.files`, retain its banner/notices, and review license changes before updates |
| Medium | Playwright browsers may not be installed in every environment | Report skipped E2E and run in release CI |
| Medium | Development tools can report advisories independent of published runtime | Audit each update; package runtime remains dependency-free |
| Low | Custom Element lifecycle recreates UI after DOM reconnection | Define desired reconnection/preserved-state behavior |

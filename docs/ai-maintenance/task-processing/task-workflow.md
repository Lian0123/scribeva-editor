<!-- AI-DOC: owner=maintainers; verified=2026-07-18; sources=AGENTS.md,docs/ai-maintenance/testing-and-verification.md -->
# Task workflow

Start with a short work record: observable goal, non-goals, evidence, affected
contract, risks, verification, and documents.

Route from the entry, locate symbols with codebase-memory, reproduce failure or
define acceptance, implement one complete slice, add behavior-focused tests,
inspect the diff, run the verification matrix, and update living documents.

Done means the behavior has evidence, security and error paths were considered,
package/API compatibility is preserved, commands and results are reported, and
a new maintainer can find the changed responsibility within two links.

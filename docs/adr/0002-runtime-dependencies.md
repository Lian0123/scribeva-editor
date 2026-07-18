# ADR 0002: Runtime dependencies

Status: Accepted on 2026-07-18.

The initial published package has zero runtime dependencies. Development tools
remain devDependencies and do not ship as imports in the consumer runtime.

A future runtime dependency requires evidence that an internal implementation
cannot meet correctness or security goals, plus license compatibility,
security audit, bundle measurement, and an updated ADR.

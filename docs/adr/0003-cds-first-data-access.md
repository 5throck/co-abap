# ADR-0003: CDS-First Data-Access Rules and SQL Quality Baseline

- **Status:** Accepted
- **Date:** 2026-10-10
- **Decider:** PM
- **Related design:** [SAP NL Analytics Semantic Layer Design](../designs/2026-10-10-sap-nl-analytics-semantic-layer-design.md)
- **Review evidence:** [CDS semantic layer meeting](../../memory/meeting-2026-10-10-cds-semantic-layer.md)

## Context

Data access was written inconsistently (raw table joins, unfiltered SELECTs). The 2026-10-10 meeting reviewed CDS-first access against the many existing Z/Y programs.

## Decision

1. The CDS-first data-access rules are DA-1..DA-8 in [co-abap.context.md](../co-abap.context.md), which is the single source of truth.
2. Existing Z/Y programs follow their existing patterns. The rules apply to new and materially changed code; there is no bulk rewrite.
3. The SQL quality baseline is a must for all new SQL, whether it reads CDS views or tables.

## Consequences

New code prefers released CDS views; legacy code is not churned. Reviewers cite DA-n identifiers. See also [ADR-0004](0004-sap-nl-analytics-semantic-layer-reference.md).

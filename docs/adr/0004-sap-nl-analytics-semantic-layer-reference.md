# ADR-0004: SAP NL-Analytics Semantic Layer Stays a Proposed Reference

- **Status:** Accepted
- **Date:** 2026-10-10
- **Decider:** PM
- **Related design:** [SAP NL Analytics Semantic Layer Design](../designs/2026-10-10-sap-nl-analytics-semantic-layer-design.md)
- **Review evidence:** [Open questions 3-5 synthesis](../../memory/meeting-2026-10-10-semantic-layer-open-questions.md)

## Context

LLM analytics over raw SAP tables yields answers that run but are wrong in business terms. A governed semantic layer was designed; no named owners or target system exist yet.

## Decision

1. The design stays status `proposed` and is a reference only; no code or SAP objects are created by it.
2. Scope: S/4HANA (VDM/CDS), BW and Datasphere sources.
3. Structured intent is the primary query path. Free-form SQL is secondary and off by default behind role and kill switches.
4. Open questions 3-5 are resolved as synthesized in the meeting record. The default meaning of a bare "revenue" is pending Finance sign-off.
5. The red-team dissent (name owners and run one source end to end before setting thresholds) is recorded, not adopted.

## Consequences

No implementation is authorized until owners and a target system exist and Finance confirms the revenue default. Related: [ADR-0003](0003-cds-first-data-access.md).

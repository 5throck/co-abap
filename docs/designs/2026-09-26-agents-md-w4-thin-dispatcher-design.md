# W4 Thin-Dispatcher Conversion — co-abap

- **Date**: 2026-09-26
- **Status**: Approved (one-design-doc convention, ADR-0074; ADR-0090 fleet rollout)

## Background & Change

Background: W4 fleet conversion of the AGENTS.md thin-dispatcher restructure (ADR-0090; workspace design docs/designs/2026-09-25-agents-md-size-reduction-design.md, audit docs/analysis/2026-09-25-agents-md-duplication-audit.md). Project AGENTS.md §3/§4/§5 drifted skeleton bodies are replaced by pointer summaries to the delivered docs/governance/agents/ references; variant-unique subsections are preserved in-place.
Change: mechanical relocation-only sweep (token-similarity adjudication, ≥0.7 threshold vs the canonical thin §3); docs/governance/agents/{pm-gateway-workflow,execution-plan-templates,workflows}.md delivered.
Verification: project audit green; pointer targets exist; no rule-content edits (N2).

## Verification

- Project audit green; pointer targets exist under docs/governance/agents/.

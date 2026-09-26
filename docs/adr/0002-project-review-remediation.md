# ADR-0002: Project-Review Remediation Controls

- **Status:** Accepted
- **Date:** 2026-09-26
- **Decider:** PM
- **Related design:** [2026-09-26 Project Review Remediation Design](../designs/2026-09-26-project-review-remediation-design.md)
- **Related decision:** [DEC-20260926-01](../decisions/DEC-20260926-01.md)
- **Review evidence:** [2026-09-26 Project Review](../reports/2026-09-26-project-review-full.md)

## Context

The 2026-09-26 project review identified gaps in delivery gates, auto-merge safety,
L3 baseline semantics, SAP MCP defaults, secret scanning, documentation validation,
and line-ending enforcement.

## Decision

1. CI must require the documentation audit, secret scan, TypeScript typecheck, and
   script-test gates.
2. Auto-merge must fail closed. It may merge only after every named required check
   completes successfully and the required current-head approvals exist. CI completion
   must trigger re-evaluation.
3. The detached L3 baseline must report template validation and template propagation
   as explicit **N/A** results when those L0-only assets are intentionally absent.
4. SAP MCP privileged capabilities use least-privilege defaults:
   `SAP_FEATURE_ABAPGIT`, `SAP_FEATURE_TRANSPORT`, `SAP_FEATURE_UI5`, and
   `SAP_FEATURE_RAP` are off unless deliberately enabled through the ignored
   `.mcp.local.json` override.
5. Gitleaks must scan tracked `memory/` content. CI must use a pinned Bun version
   and a digest-pinned gitleaks image.
6. Documentation links are semantic repository contracts. Relative links and anchors
   must resolve, while illustrative link syntax inside code samples is not treated as
   navigable documentation.
7. Repository text uses LF line endings. `.gitattributes` defines the checkout policy,
   and the audit detects LF-policy regressions.

## Consequences

The project has a deterministic local quality baseline and explicit CI controls.
Security-sensitive MCP features require local, deliberate opt-in. L3 projects do not
misreport intentionally absent L0 tooling as passing or failing checks.

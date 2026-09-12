# Universal Design Gate — Phase C fleet adoption (co-abap)

- **Spec ID**: 2026-09-12-universal-design-gate-phase-c
- **Date**: 2026-09-12
- **Status**: implemented
- **Related**: ADR-0074, ADR-0073 Amendment 2, workspace design doc `2026-09-12-universal-design-gate-design.md`

## Summary

Fleet adoption of the Universal Design Gate (operator decision 2026-09-12: L3 hard-gated from the
first code change). `upgrade-project --prune-removed` delivered the spec infrastructure to this
project: `docs/specs/registry.json` seed (add-if-missing; project entries never overwritten) and
the `scripts/spec-register.ts` mirror (L0+L1). Existing design docs were backfilled into the
registry via spec-register (idempotent). From this point the sync-time spec-check
(`audit.ts --spec-check`, dev-sync step 3.9) is ACTIVE: code changes require spec activity —
a design doc under `docs/designs/` registered via `spec-register.ts` — with `--spec-exempt=E1..E5`
as the escape hatch for trivial changes.

## Accessibility / Preview Verification

Non-UI governance/CLI change — exempt with explicit statement (AGENTS.md §5.1, ADR-0070).

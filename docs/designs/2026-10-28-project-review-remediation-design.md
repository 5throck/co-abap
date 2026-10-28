# 2026-10-28 Project Review Remediation — Design

**Spec ID**: 2026-10-28-project-review-remediation-design
**Date**: 2026-10-28 (implemented 2026-10-29)
- **Status**: implemented
**Source**: `docs/reports/2026-10-28-project-review-full.md` (0 Critical / 10 High / 12 Moderate / 2 Low)
**Decision**: `docs/decisions/DEC-20261028-09.md`
**Upstream adjudication**: U-20261028-004 (H-1), U-20261028-005 (H-2), U-20261028-012 (M-8), U-20261028-013 (H-10)

## Context and Scope

This is the remediation batch for the 2026-10-28 full project review. The prior
remediation designs (2026-09-25, 2026-09-26) are historical and do not define this
batch. On 2026-10-28 the PM filed twelve L1/L2-origin findings upstream
(U-20261028-004 … U-20261028-015); on 2026-10-29 the user approved local
remediation (Korean-language approval message, 2026-10-29 session) ahead of
upstream delivery, and the gate adjudication is recorded in
`docs/decisions/DEC-20261028-09.md`.

The batch covers the eleven remediation items assigned to this round. Items whose
texts are template-managed (M-1/M-2/M-3/M-5/M-10), core scripts (`dev-sync.ts`,
`audit.ts` — local modification forbidden), and the two Low findings accepted as-is
(L-1/L-2) are explicitly out of scope.

## Non-Goals

- No edits to template-managed texts (M-1/M-2/M-3/M-5/M-10) — owned by the upgrade
  pipeline; local edits would be overwritten or create drift.
- No edits to core scripts `scripts/dev-sync.ts` / `scripts/audit.ts` — local
  modification forbidden per the Core Script Standardization policy.
- No edits to `scripts/hooks/pre-commit.ts` / `scripts/hooks/pre-push.ts` — they are
  template-managed; the false "used by hooks/…" claim is corrected in the registry
  (`scripts/SCRIPTS.md`), not in the hooks.
- No edits to the `U-20261028-015` LOCAL-PATCH marker in
  `scripts/co-abap/install-vsp.ts` — that ticket is pending upstream, the marker
  stays.
- L-1/L-2 accepted as-is (no change).
- No re-adjudication of historical gate outcomes (H-9 records them, it does not
  re-run them).
- No extension of `scripts/helpers/gitleaks-merge.ts` (see Risks — residual
  `[[rules]]` merge gap recorded, upstream follow-up candidate).

## Implementation Approach (per item)

1. **U-004/H-1 — secret patterns into `.gitleaks.toml`**: port the custom
   SECRET_ERE token patterns from `scripts/lib/secret-patterns.ts` into project
   `.gitleaks.toml` as `[[rules]]` entries (defense in depth on top of
   `useDefault = true`), tagged with a `LOCAL-PATCH(upstream-request: U-20261028-004)`
   provenance comment. Delete the orphaned `scripts/lib/secret-patterns.ts` (its sole
   remaining importer is the SCRIPTS.md registry row). Remove the
   `lib/secret-patterns.ts` registry row and with it the false claim that
   `hooks/pre-commit.ts` / `hooks/pre-push.ts` consume the module (the hooks are
   template-managed and were not edited). The generic credential-assignment
   heuristic (`ASSIGNMENT_PATTERN`) is deliberately NOT ported: it was a
   diff-added-line heuristic for hook use, too false-positive-prone for gitleaks
   full-history scans, and gitleaks' default rule set already covers generic
   assignment shapes.
2. **U-012/M-8 (residual) — SCRIPTS.md header prose**: rewrite the `SCRIPTS.md:3`
   sentence that claims `lib/` and `helpers/` are "intentionally excluded" — the
   Registry actually holds the full tracked-script inventory (130 of 205 rows live
   in subdirectories), which is what keeps headerless libs under Check A version
   comparison. Marked with `LOCAL-PATCH(upstream-request: U-20261028-012)`.
3. **U-005/H-2 — CHANGELOG backfill**: add two `chore(upgrade)` entries to
   `[Unreleased]` → **Changed**, citing the PR numbers (the template CHANGELOG is
   not available in this detached L3 checkout): template delivery 0.20.1
   (PR #221, delivered 2026-10-26) and the 0.22.0 wave (PR #224, delivered
   2026-10-27). The 0.22.1 wave was already recorded 2026-10-28 and is not
   duplicated. Marked with `LOCAL-PATCH(upstream-request: U-20261028-005)`.
4. **U-013/H-10 — duplicate category headings**: consolidate the `[Unreleased]`
   duplicate headings (3× Added, 4× Changed, 3× Fixed + Security + Removed) into
   exactly one block per category, newest-first within each category, preserving
   all entry text verbatim; the category order (Added, Changed, Fixed, Security,
   Removed) is preserved to minimize diff churn.
5. **H-5 — vsp binary facts**: rewrite the "Deployed vsp Binary" section of
   `docs/co-abap.context.md`: binary name is `vsp` (not `vsp.exe`), gitignored at
   the repo root (`/vsp` in `.gitignore`), last replaced 2026-10-11; record the
   pinned version 2.60.0 (as the Tech Stack section and
   `scripts/co-abap/install-vsp.ts` `PINNED_VERSION` already state) and mark the
   old v2.38.1 / 2026-04-07 deployment superseded (written without the `v` prefix
   so the `vsp-version-pin` claim scan does not flag it); fix the upgrade
   instruction to reference the correct file name. The `:23` (Tech Stack) and
   `:37` (Environment Setup) rows already agree with the pinned version and are
   not changed — the deployed table was the stale side of the contradiction.
6. **H-7 — pm.md frontmatter**: remove the duplicated top-level `last_updated`
   key (the nested `lifecycle.last_updated` is authoritative; all other 20 agents
   use only the nested form). The frontmatter sits outside the WORKSPACE-MANAGED
   body block; the managed body is untouched.
7. **M-4 — stray root files**: delete the untracked, gitignored leftovers
   `CHANGELOG.md.tmp` (0 bytes) and `CLAUDE.md.pre-skeleton.bak` (succeeded
   skeleton wave leftover).
8. **M-6 — variant.json**: add `"promotionChecklist": "PROMOTION_CHECKLIST.md"`
   after `country_config`, matching the `docs/workspace-schema.json` description
   ("relative path from variant root to the PROMOTION_CHECKLIST.md file"); JSON
   stays valid.
9. **M-7 — opencode.json documentation**: add one line to the MCP/tooling section
   of `docs/co-abap.context.md` documenting the root-level `opencode.json`
   (OpenCode editor config registering the graft MCP server), permitted under the
   "Configuration, tooling files" root-file category.
10. **H-9 — retrospective DEC records**: backfill ADR-0061 decision records for
    the historical DG-ABAP-01/DG-ABAP-02 gate adjudications: REQ-001 Stage 4 QA
    gate (2026-09-25, PASSED) as `DEC-20261028-07` and ZR_SFLIGHT_QUERY
    (2026-10-13, syntax PASSED, ATC 0×P1) as `DEC-20261028-08`, following the
    exact format of `docs/decisions/DEC-20260926-01.md`, each noted as a
    retrospective record with `evidence_refs: []` (no EV-* ledger rows exist) and
    `rules_applied: []` (no variant rule-ID registry).
11. **M-11 — derived artifact regeneration**: run
    `bun scripts/generate-version-manifest.ts` (picks up the pm.md edit), then
    verify `bun scripts/verify-scripts.ts --verify` and the audit
    VERSION_MANIFEST gate still pass.

## Ordering

1. Records first: design doc (this file) + DEC-20261028-09 gate record, then the
   two retrospective DEC records (-07, -08) — they are referenced by everything
   else.
2. Config/data fixes: `.gitleaks.toml` rules, `variant.json`, stray-file deletion,
   pm.md frontmatter.
3. Documentation corrections: SCRIPTS.md (header prose + row removal),
   `docs/co-abap.context.md` (vsp section + opencode line), CHANGELOG
   (backfill + consolidation).
4. Deletion of `scripts/lib/secret-patterns.ts` after its registry row is removed.
5. Regenerate derived artifacts and run the verification gates.

## Risks and Rollback

| Risk | Mitigation | Rollback |
|---|---|---|
| `mergeGitleaksToml` (scripts/helpers/gitleaks-merge.ts 1.0.0) merges only the `regexes`/`paths` allowlist arrays — a project-only `[[rules]]` block is NOT carried over when the template config is re-merged on upgrade. | The rules block carries a `LOCAL-PATCH(upstream-request: U-20261028-004)` provenance comment; the residual gap is recorded here as an upstream follow-up candidate; gitleaks `useDefault = true` still covers the same token shapes. | Restore `scripts/lib/secret-patterns.ts` and the registry row from git history; re-apply rules after the merge helper learns `[[rules]]`. |
| CHANGELOG consolidation drops or reorders an entry. | Entries are single lines; consolidation is done by a deterministic script that preserves entry text verbatim and sorts only by date (stable within a date); full diff review before commit. | Revert the CHANGELOG commit. |
| Registry row removal breaks `verify-scripts.ts --verify`. | The row is removed together with the file; the gate is run immediately after. | Restore both from git. |
| vsp-version-pin gate trips on rewritten context.md text. | Version strings are written without the `v` prefix except the already-passing `v2.60.0` claims; `check-project-meta.ts` run verifies. | Revert the context.md edit. |
| pm.md frontmatter edit regresses agent validation. | Only the duplicate top-level key is removed; agent-lifecycle checks run via the manifest regeneration and audit. | Restore the line from git. |

## Verification

```text
gitleaks git --no-banner
bun scripts/check-project-meta.ts
bun scripts/verify-scripts.ts --verify
bun scripts/generate-version-manifest.ts   # then confirm no unintended diff
bun scripts/audit.ts                       # VERSION_MANIFEST gate included
bun run typecheck
bun scripts/validate-decisions.ts          # DEC-20261028-07/-08/-09 frontmatter
```

Note (recorded at closeout): `gitleaks git` reports 68 `generic-api-key` findings
on historical commits (vendored ABAP source under `scratch/` in old commit
layouts). This is the pre-existing baseline — byte-identical counts with the
pre-change config — and none of the 68 come from the new `co-abap-*` rules;
the pre-push working-tree scan stays clean.

## Acceptance Criteria

- `.gitleaks.toml` carries the custom secret-pattern rules with provenance
  comments; `scripts/lib/secret-patterns.ts` and its registry row are gone; no
  file references the deleted module.
- `scripts/SCRIPTS.md` header prose matches registry reality and cites the
  upstream ticket.
- CHANGELOG `[Unreleased]` has exactly one heading per category, entries
  newest-first, with the 0.20.1 (PR #221) and 0.22.0 (PR #224) `chore(upgrade)`
  entries present and the 0.22.1 entry not duplicated.
- `docs/co-abap.context.md` Deployed-vsp-Binary section states the real binary
  name, gitignore status, replacement date and the pinned 2.60.0 version, with
  the 2.38.1 deployment marked superseded; `opencode.json` is documented in the
  MCP section.
- `agents/pm.md` frontmatter carries exactly one `last_updated` (nested), with
  the WORKSPACE-MANAGED body untouched.
- `CHANGELOG.md.tmp` and `CLAUDE.md.pre-skeleton.bak` no longer exist.
- `variant.json` is valid JSON and exposes `promotionChecklist`.
- `docs/decisions/` contains DEC-20261028-07/-08/-09 in the DEC-20260926-01
  format and `validate-decisions.ts` passes.
- Spec `2026-10-28-project-review-remediation-design` is registered
  (`--source manual`), `docs/VERSION_MANIFEST.md` regenerated, and the listed
  gates pass.

## Implementation Outcome

Implemented 2026-10-29. All eleven items landed as specified; the DEC numbering
allocated -07 (REQ-001 backfill), -08 (ZR_SFLIGHT_QUERY backfill) and -09 (Design
Gate ruling). Gates observed passing at closeout are listed in the Verification
section.

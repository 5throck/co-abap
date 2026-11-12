# 2026-11-13 Upstream Ledger Consolidation + opencode.json Documentation — Design

**Spec ID**: 2026-11-13-upstream-ledger-consolidation-design
**Date**: 2026-11-13
**Status**: implemented
**Source**: 2026-11-12 full project review findings H-3 (two unreconciled upstream ledgers) and M-2 (opencode.json undocumented — third carry-over)
**Precedent**: `docs/designs/2026-11-12-project-review-remediation-design.md`

## Context and Scope

Upstream bookkeeping in this project is fragmented across three incompatible
series: the `§`-numbered items in `docs/upstream-fix-list.md` (header dated
2026-08-24, items §1–§9 from the 2026-08-23/24 and 2026-09-26 review cycles),
the UR-1..UR-6 series recorded in CHANGELOG/LOCAL-PATCH markers from the
2026-10-10 review cycle, and the two upstream ticket waves (U-20261028-004…-015,
U-20261112-010…-019) tracked in the upstream request store. The 2026-10-28
review flagged this as H-4 and the 2026-11-12 review re-flagged it as H-3; both
prescribed the same remedy: ONE consolidated ledger, keyed to the live
LOCAL-PATCH markers that `scripts/helpers/local-patch-scan.ts` enumerates,
reconciled after every upgrade delivery. This batch executes that remedy plus
the M-2 one-line documentation anchor for `opencode.json`.

Every §-series item is adjudicated against the current codebase before a final
status is written — evidence over assumption. Where the upstream store has no
record, the ledger says so explicitly instead of inventing a status.

## Non-Goals

- No code or script changes — docs-only batch.
- No commits, pushes, or PRs — the batch leaves the working tree ready.
- No renumbering of UR-/U- ids in code or CHANGELOG history — the historical
  series names stay searchable; only the ledger consolidates them.
- No changes to core scripts (`dev-sync.ts`, `audit.ts`) — forbidden per the
  Core Script Standardization policy.
- No removal of `opencode.json` — M-2 offered "document" vs "remove"; the
  documented anchor option is taken here. If a later decision removes the
  file, the anchor line goes with it.

## Implementation Approach (per item)

1. **Design doc (Row 0)**: this file, registered via
   `bun scripts/spec-register.ts --file docs/designs/2026-11-13-upstream-ledger-consolidation-design.md --source manual --status implemented`.
2. **ITEM 1 — consolidated upstream ledger (H-3/H-4 remedy)**: rewrite
   `docs/upstream-fix-list.md` in place (filename unchanged) as the single
   consolidated upstream ledger:
   - Header declares the file THE consolidated upstream ledger, superseding
     the §-series numbering, with a historical §→disposition index retained
     as text (including the SECRET_ERE hook patch, which was never
     §-numbered but is frequently mis-cited as "§2").
   - "Live LOCAL-PATCH markers" table generated from
     `bun -e "import { scanLocalPatches } from './scripts/helpers/local-patch-scan.ts'; …"`
     (the helper is a pure library, no CLI), recording marker location →
     upstream id → status, 51 occurrences as of 2026-11-13.
   - "Ticket waves" tables: UR-1..UR-6 (status from CHANGELOG/report/git
     evidence), U-20261028-004…-015 (all `done`, archived; outcomes from the
     governance store), U-20261112-010…-019 (statuses from
     `upstream_request_status` on 2026-11-13: -012 done/fixed PR #1991,
     -013…-019 review, -010/-011 not found in the store — ids collide with
     same-day co-develop requests; recorded as unverified, re-file needed).
   - "Reconciliation duty" section: after every upgrade-project delivery,
     re-run the local-patch scan, diff against the live-marker table, and
     refresh statuses from `upstream_request_status`.
3. **ITEM 2 — opencode.json anchor (M-2, documented option)**: add ONE line to
   the MCP Configuration section of `docs/co-abap.context.md` stating that
   `opencode.json` (repo root) is the opencode editor surface config
   registering the trail MCP server, schema-permitted per
   `docs/workspace-schema.json` (root-file allowlist line 207), drift control
   same as the other five MCP surfaces.

## Ordering

1. Design doc (this file) + registration.
2. Ledger rewrite (ITEM 1) — largest artifact, depends only on the evidence
   already gathered.
3. context.md anchor line (ITEM 2).
4. Verification gates (below).

## Risks and Rollback

| Risk | Mitigation | Rollback |
|---|---|---|
| Ledger statuses drift from the upstream store the moment a ticket moves. | The ledger carries a "as of 2026-11-13" stamp per table and the reconciliation duty turns refreshing into a post-upgrade routine, not a one-shot. | Overwrite statuses on next reconciliation pass. |
| Rewriting upstream-fix-list.md breaks a doc-link or a registry check that expects the old headings. | Docs-only file; audit's docs-link gate runs in verification; the §-references remain as plain text in the historical index. | `git checkout -- docs/upstream-fix-list.md`. |
| Phantom U-20261112-010/-011 record causes false confidence. | Ledger explicitly marks them "not found in store — unverified, re-file needed" instead of mapping them to the co-develop tickets that hold those ids. | N/A (honest-record design). |
| context.md line contradicts a future removal decision. | The line is one sentence, self-contained; the ledger notes it goes with the file if retired. | Delete the line. |

## Verification

```text
bun scripts/audit.ts                                   # must PASS
grep -n "^## " docs/upstream-fix-list.md               # no §-numbered headings
bun -e "…scanLocalPatches…"                            # 51 findings, matches ledger table
```

## Acceptance Criteria

- `docs/upstream-fix-list.md` is the single consolidated upstream ledger: no
  §-numbered headings remain (§-names survive only inside the historical
  index as text), every §-item carries an evidence-backed final disposition,
  the live-marker table matches the scan output, and both ticket waves are
  recorded with store-verified statuses (gaps marked unverified, not invented).
- The reconciliation duty is written down with the exact command sequence.
- `docs/co-abap.context.md` MCP Configuration section carries the one-line
  opencode.json anchor.
- The design doc is registered in `docs/specs/registry.json` with status
  `implemented`.
- `bun scripts/audit.ts` passes; nothing is committed.

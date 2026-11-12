# 2026-11-12 Project Review Remediation — Design

**Spec ID**: 2026-11-12-project-review-remediation-design
**Date**: 2026-11-12
**Status**: implemented
**Source**: 2026-11-12 full project review findings (15 items; 1 Critical) + upstream tickets U-20261112-010 … U-20261112-019
**Precedent**: `docs/designs/2026-10-28-project-review-remediation-design.md`

## Context and Scope

This is the remediation batch for the 2026-11-12 full project review. The review
found the workspace's graft→Trail MCP migration half-landed in this project: the
0.29.0→0.30.0 template waves and the in-flight MCP migration left the five
platform instruction documents, permission files, context docs and registries in
a mixed graft/trail state. Ten findings were filed upstream
(U-20261112-010 … U-20261112-019); this batch applies the local fixes ahead of
upstream delivery, marking each template-managed-text deviation with the
`LOCAL-PATCH(upstream-request: U-…)` convention (pm.md Upstream Reporting Duty).

The batch covers all fifteen remediation items assigned to this round. Core
scripts (`dev-sync.ts`, `audit.ts`) are not touched. No commits are made — the
round leaves the working tree staged-ready for the `/sync` pipeline.

## Non-Goals

- No edits to core scripts `scripts/dev-sync.ts` / `scripts/audit.ts` — local
  modification forbidden per the Core Script Standardization policy.
- No upstream-facing fixes to the review-false-positive class (hook-fixture
  trailing-newline WARN) beyond the byte-local fixture fix — upstream
  U-20261112-012 owns the checker-side fix.
- No restoration-by-fabrication of the missing DA-1..DA-8 rules section (item 6c):
  if the section content cannot be found in the template tree or workspace-root
  docs, the false version-footer claim is corrected and the citing files get a
  pending-restoration note instead of invented rule text.
- No commits, pushes, or PRs — the round ends with a verified working tree.
- No re-audit of historical CHANGELOG waves other than the two named backfills
  and the one deduplication.

## Implementation Approach (per item)

1. **Design doc (Row 0)**: this file, registered via
   `bun scripts/spec-register.ts --file <this file> --source manual --status implemented`.
2. **ITEM 1 (Critical) — graft→trail instruction-doc completion (U-20261112-010)**:
   complete the MCP migration in all five instruction documents, taking the trail
   blocks verbatim from the template tree:
   - `AGENTS.md`: the working tree already carries the trail block (verbatim match
     against `templates/co-abap/AGENTS.md` verified); add the
     `<!-- LOCAL-PATCH(upstream-request: U-20261112-010) -->` marker above
     `<!-- trail:start -->`.
   - `HERMES.md`: replace the graft block (graft:start…graft:end) with the trail
     block from `templates/common/HERMES.md` (in-place, same position after the
     COMMON-HERMES block).
   - `CODEX.md`: replace the graft prose sentence + `[mcp_servers.graft]` TOML
     block in §4 MCP Configurations with the trail-era prose + `[mcp_servers.trail]`
     TOML from `templates/common/CODEX.md`; replace the graft markdown block with
     the trail markdown block (project SAP Safety tail stays after it).
   - `CLAUDE.md` / `GEMINI.md`: these have no graph block at all; insert the trail
     block at the template's relative position — end of the template-managed
     content region, immediately before the project-specific "SAP Safety" tail.
   - Each swapped block's start carries the LOCAL-PATCH marker above `trail:start`
     (or above the TOML fence for the CODEX §4 block).
   - Exit criterion: `grep -rn "graft:start"` returns nothing across the five
     files and `trail:start` is present in all five.
3. **ITEM 2 — `.claude/settings.json`**: delete the stale
   `"Bash(node dist/cli.js:*)"` allow entry (graft-era leftover; the binary path
   no longer exists in the repo).
4. **ITEM 3 — CHANGELOG backfill + dedupe (U-20261112-011 class)**:
   (a) add two `[Unreleased]` → Changed `chore(upgrade)` entries for the
   0.29.0→0.30.0 wave — PR #241 (delivery, 2026-11-08, commit 6add817) and
   PR #242 (completion, 2026-11-08, commit ebcacde; facts from git log and
   `.claude/last-upgrade-delivery.json` templateVersion 0.30.0);
   (b) remove the duplicated 2026-10-28 wave entry from the wave-log bullet layer
   (no PR ref), keeping the `### Changed` copy that carries `(#225)`.
5. **ITEM 4 — hook fixtures trailing newline**: append a trailing newline to the
   five `scripts/hooks/__fixtures__/hf-*.json` files (byte-safe; silences the
   false-positive WARN locally; checker-side fix pending upstream
   U-20261112-012).
6. **ITEM 5 — `.gitattributes`**: delete the final `* text=auto eol=lf` catch-all
   line — last-match-wins overrides the earlier `*.cmd`/`*.bat eol=crlf` intents;
   the rest of the file is untouched.
7. **ITEM 6 — `docs/co-abap.context.md` (U-20261112-016)**, with a LOCAL-PATCH
   comment near the top listing the sub-fixes:
   - 6a: rewrite the "Deployed vsp Binary" section — binary is `vsp`
     (gitignored, repo root), pinned 2.60.0 per the Tech Stack section; the old
     2.38.1/2026-04-07 row is marked superseded; upgrade-instruction filename
     aligned.
   - 6b: remove the ghost `sync-mcp.ts` Scripts-table row and the "Run
     bun scripts/sync-mcp.ts" instruction; replace with one sentence stating that
     MCP server definitions live across 6 surfaces (`.mcp.json`,
     `.claude/settings.json`, `.gemini/settings.json`, `.agents/mcp.json`,
     `.codex/config.toml`, `opencode.json`) and drift is controlled by the
     mcp-proxy-routing parity gate (`scripts/validate-abap-platform-parity.ts`).
   - 6c: search `templates/co-abap/docs/co-abap.context.md` and workspace-root
     `docs/` for the Data Access Rules DA-1..DA-8 section; restore verbatim if
     found, otherwise correct the version footer's false claim and append
     `[DA-1..DA-8 rules pending restoration — upstream U-20261112-016]` notes to
     the citations in `skills/abap-dev/SKILL.md` (:55, :77) and
     `docs/standards/clean-abap-checklist.md` (:117).
   - 6d: bulk re-point the dead anchor
     `#vsp-tool-reference-hyperfocused-mode` → `#upstream-vsp-reference-build--test`
     in every citing markdown file, and fix the SSOT paragraph that instructs
     agents to cite the old anchor.
8. **ITEM 7 — AGENTS.md §3.7.5**: qualify the
   `docs/designs/2026-08-16-governance-backlog-design.md` citation as
   workspace-root-only with a LOCAL-PATCH(U-20261112-017) marker on the line above.
9. **ITEM 8 — `agents/pm.md`**: remove the duplicate top-level `last_updated:`
   frontmatter key (nested `lifecycle.last_updated` is authoritative; plain
   removal — this regressed via the 0.29/0.30 waves after the 2026-10-28 fix).
10. **ITEM 9 — `scripts/SCRIPTS.md:3`**: replace the rotting hard counts
    "(130 of 205 rows live in subdirectories)" with non-rotting phrasing
    ("the Registry is the full tracked-script inventory (the majority of rows
    live in subdirectories)"); row counts unchanged.
11. **ITEM 10 — retrospective DEC record**: `docs/decisions/DEC-20261112-01.md`
    for the REQ-002 (ZSFLIGHT_REPORT) delivery QA gate, following the exact
    format of `DEC-20261028-08.md`; decision = gate passed per CHANGELOG
    evidence; evidence_refs = CHANGELOG REQ-002 entries +
    `docs/reports/2026-10-28-project-review-full.md`; marked "Retrospective
    record (backfilled 2026-11-12)".
12. **ITEM 11 — `memory/MEMORY.md`**: remove the two dead index rows (2026-10-22,
    2026-10-26 — target files verified absent); no other rows touched.
13. **ITEM 12 — `PROMOTION_CHECKLIST.md`**: qualify workspace-root-only references
    (`docs/adr/0099-…` → "workspace-root: …"), fix the cited review-report path to
    an existing file or mark it L0-only, and source the agent/skill counts from
    `docs/VERSION_MANIFEST.md` (21 agents / 50 skills) instead of the nonexistent
    `variant.json` `skills[]` keys.
14. **ITEM 13 — `SECURITY.md`**: append a "Local tool hooks" note documenting the
    `.trail/hook.cjs` artifact: tool-managed vendored, fail-open (`|| exit 0`),
    no secrets/network observed (2026-11-12 review), but resolves hook modules
    from the highest-versioned installed trail/graft package without pinning
    (supply-chain trust assumption) and injects vendor-authored context when the
    module is absent; recorded per the 2026-09-25 review recommendation.
15. **ITEM 14 — `.claude/settings.local.json`** (untracked, machine-local):
    remove the graft-era allow entries `Bash(graft:*)`, `Bash(npx graft:*)`,
    `Bash(graft-dev:*)`, `Bash(node dist/cli.js:*)`; keep `Bash(trail:*)` and all
    other entries.
16. **ITEM 15 — verification**: run the full gate suite (below) and fix anything
    the edits broke.

## Ordering

1. Records first: design doc (this file) + retrospective DEC-20261112-01.
2. Instruction-doc swaps (ITEM 1) — the Critical item, largest blast radius.
3. Config/permission fixes (ITEM 2, 5, 14), fixtures (ITEM 4).
4. Documentation corrections (ITEM 3, 6, 7, 8, 9, 11, 12, 13).
5. Verification gates (ITEM 15).

## Risks and Rollback

| Risk | Mitigation | Rollback |
|---|---|---|
| Trail-block swap breaks a template hash baseline (`audit.ts` upgrade-scope guard or `.claude/last-upgrade-delivery.json` baselines). | Blocks are taken verbatim from the template tree; the parity and audit gates run immediately after the swap. | `git checkout -- <file>` (AGENTS.md trail block was already swapped in the working tree — revert returns to the committed graft block). |
| Anchor re-point (6d) misses a citing file or hits a non-anchor use of the string. | `grep -rl` enumerates all citing files; the replacement string includes the `#` so only anchor citations match; post-count check re-runs the grep. | Revert the touched files. |
| CHANGELOG edits break the entry format the pre-push changelog gate expects. | Entries follow the exact format of the adjacent 0.20.1/0.22.0 backfill entries; audit runs after. | Revert CHANGELOG.md. |
| Fixture newline change trips a byte-comparison test. | Tests read JSON content, not raw bytes; `bun test scripts` runs in verification. | Strip the added newline. |
| `.gitattributes` catch-all removal changes working-tree normalization. | The line only added `eol=lf` intent for un-annotated types; audit + pre-push VERSION_MANIFEST gate run after. | Restore the line from git. |
| SCRIPTS.md rewording breaks `verify-scripts.ts --verify` row parsing. | Only the header prose sentence changes; no rows touched; the gate runs in verification and must stay at 209 OK. | Revert SCRIPTS.md. |

## Verification

```text
grep -rn "graft:start" AGENTS.md HERMES.md CODEX.md CLAUDE.md GEMINI.md   # 0 hits
grep -c "trail:start" AGENTS.md HERMES.md CODEX.md CLAUDE.md GEMINI.md    # 1 each
bun scripts/audit.ts                        # must PASS
bun scripts/validate-abap-platform-parity.ts  # 6/6
bun run typecheck                           # clean
bun test scripts                            # 213 pass
bun scripts/verify-scripts.ts --verify      # 209 OK (ITEM 9 must not change row counts)
```

## Acceptance Criteria

- All five instruction documents carry the trail block (verbatim from the
  template tree) with the LOCAL-PATCH(U-20261112-010) marker, and no
  `graft:start` markers remain in them.
- `.claude/settings.json` and `.claude/settings.local.json` no longer allow the
  graft-era `node dist/cli.js` / graft CLI entries; `Bash(trail:*)` survives.
- CHANGELOG `[Unreleased]` carries the 0.30.0 delivery (#241) and completion
  (#242) entries and exactly one 2026-10-28 wave entry (the `### Changed` one
  with `(#225)`).
- The five hook fixtures end with a newline; `.gitattributes` no longer has the
  `* text=auto eol=lf` catch-all.
- `docs/co-abap.context.md` states the real vsp binary facts, has no
  `sync-mcp.ts` ghosts, documents the 6-surface MCP definition layout, and every
  vsp-tool-reference anchor citation points at the live heading; the DA-1..DA-8
  handling matches the 6c decision branch actually taken (recorded in the
  Implementation Outcome).
- AGENTS.md §3.7.5 cites the governance-backlog design as workspace-root-only;
  `agents/pm.md` has exactly one `last_updated` (nested).
- `scripts/SCRIPTS.md` header prose no longer rots; DEC-20261112-01 exists in the
  DEC format and `validate-decisions.ts` accepts it; MEMORY.md has no dead index
  rows; PROMOTION_CHECKLIST.md has no dead evidence pointers; SECURITY.md
  documents the trail hook.
- The listed gates pass; nothing is committed.

# Project Review — co-abap — 2026-11-12

**Date**: 2026-11-12
**Scope**: L3 variant project (co-abap) — full review + in-session improvement round (T-01)
**Method**: Machine battery + 4 domain slots (architect / read-only-analyst / devops-admin / i18n-specialist+security-monitor personas; slots dispatched sequentially in foreground — background dispatch hit concurrency limits in this environment on 2026-10-28, the skill's declared fallback). Cross-domain dedup by PM. Improvement round executed in-session: remediation batch (15 items) + skill-lifecycle-records batch (49 records), both via specialist dispatch, all gates re-verified green before this report.

## Baseline (Step 0)

| Check | Result |
|-------|--------|
| `bun scripts/audit.ts` | ✅ PASS — recurring WARNs: CRLF fixtures ×5 (later proven detector false positive, see H-4), zero-width char scripts/dispatch-parallel.ts:166:28 (deliberate BOM-strip regex literal; file is deny-protected, L0-owned — upstream hardening candidate) |
| `bun scripts/agent-lifecycle-audit.ts` | 21/21 healthy, 0 WARN (delivery-baseline tolerance working as adjudicated in U-20261028-006) |
| `bun scripts/skill-lifecycle-audit.ts` | 50 skills / **42 WARN** — first honest L3 reporting since U-20261028-011; cured to 0 this session (H-1) |
| `bun scripts/verify-scripts.ts --verify` | 209 scripts OK |
| `bun run typecheck` / `bun test scripts` | clean / 213 pass 0 fail |
| `review-baseline.ts` (skill Step 0 reference) | not delivered to L3 — "Module not found"; individual battery used (docs finding, minor) |
| Working tree at review start | 7 uncommitted files: graft→trail MCP migration (PR #244/#245 direction), gate-consistent (audit PASS on the dirty tree) |

Open PRs at review start: 0. base-map MCP: n/a. Note: the trail MCP (graft successor) is available to sessions.

## Findings

### 🔴 Critical (fix immediately)

| # | Issue | Agent | File:Line | Class | Fix |
|---|-------|-------|-----------|-------|-----|
| C-1 | graft→trail migration complete on MCP surfaces but NOT on instruction docs: AGENTS.md:563-603/HERMES.md:95/CODEX.md:76-81 still teach the dead `graft` CLI (binary uninstalled), CLAUDE.md/GEMINI.md carry no context-graph block, while templates/co-abap/AGENTS.md had the trail block since 2026-11-08 01:06 — before this project's 0.30.0 upgrade (13:09) which skipped it. Root cause: tool-owned blocks live outside COMMON-*/WORKSPACE-MANAGED merge zones; `trail init` wired hooks but skipped doc blocks here; TB-01 parity runs only in L0 validate-templates, never in delivered CI | architect | AGENTS.md, HERMES.md, CODEX.md, CLAUDE.md, GEMINI.md | systemic | **Fixed this session**: block swaps from templates/common/* + templates/co-abap/AGENTS.md (graft:start=0, trail:start=1 in all 5), LOCAL-PATCH(U-20261112-010) markers; upstream ticket **U-20261112-010** (delivery-side swap + delivered-side detector) |

### 🟡 High (fix within 1 week)

| # | Issue | Agent | File:Line | Class | Fix |
|---|-------|-------|-----------|-------|-----|
| H-1 | 42/50 skills fail the lifecycle-record check (honest post-U-011 signal): 28 have workspace-root seeds needing adaptation, 14 variant-born skills have no record anywhere, explain-me correctly exempt (experimental); upstream: templates ship docs/lifecycle/agents/ but NO docs/lifecycle/skills/ | read-only-analyst | docs/lifecycle/skills/ (7 files vs 50 skills) | systemic + script-gap | **Fixed this session**: 49 records (28 ported+adapted, 14 authored from git dates — no fabricated history, 7 rewritten to project-local form with working dual-Metadata); audit now "All 50 skills healthy"; upstream **U-20261112-011** |
| H-2 | 0.30.0 template wave (2026-11-08) landed with no CHANGELOG entry — third recurrence of the 10-28 H-2 pattern; wave was logged as "workspace sync (92 files)" | read-only-analyst | CHANGELOG.md, template-version.txt:3-5, memory/2026-11-08.md | systemic | **Backfilled this session** (PR #241/#242 entries); standing automation remains tracked upstream in the delivery-bookkeeping engine (per U-20261028-013 resolution) — recurrence shows it is not yet deployed |
| H-3 | Upstream bookkeeping still two unreconciled ledgers (docs/upstream-fix-list.md §-series vs UR-ids); §9's subject (graft helper re-bake vector) is being mutated by the live migration | read-only-analyst | docs/upstream-fix-list.md:3-5 | systemic | Open — original H-4 remedy (UR-keyed consolidated ledger, reconcile via local-patch-scan after each upgrade) remains the plan |
| H-4 | CRLF audit WARNs are a detector false positive: the 5 hf-*.json fixtures have ZERO CR bytes; detectEncoding's final else labels zero-EOL files "mixed" (encoding-utils.ts:86-93, L0 layer) | devops-admin | scripts/lib/encoding-utils.ts:86-93 | script-gap | **Local mitigation this session** (trailing newline on 5 fixtures); upstream **U-20261112-012** |
| H-5 | Trail hook wiring completely unguarded — no gate resolves hook command targets to existing files (deleting .trail/hook.cjs passes everything) | devops-admin | .claude/settings.json:73, .trail/hook.cjs | script-gap | Upstream **U-20261112-013** (existsSync hook targets in lifecycle-sync-audit Check I) |
| H-6 | SSOT anchor `co-abap.context.md#vsp-tool-reference-hyperfocused-mode` cited by **68 files**; heading removed in the 0.18.0 wave; earlier remediation re-pointed only docs/mcp_usage.md | i18n-specialist | docs/co-abap.context.md + 67 citers | systemic | **Fixed this session**: 68 citations re-pointed to `#upstream-vsp-reference-build--test` (+9 .gemini/commands/*.toml mirrors caught by the render test); upstream **U-20261112-016** |
| H-7 | Data Access Rules DA-1..DA-8 vanished from docs/co-abap.context.md while its version footer claims they were added, and skills/abap-dev/SKILL.md:55,77 + docs/standards/clean-abap-checklist.md:117 instruct agents to follow them (12 dead anchors) — SAP-relevant content dropped by the 0.18.0 wave | i18n-specialist | docs/co-abap.context.md:550 area | systemic | **Fixed this session**: section restored byte-identical from this repo's git history (added c871e63 2026-10-10, dropped 78adacd), footer bumped v1.2; upstream **U-20261112-016** |
| H-8 | **Wave-revert recurrence class (meta)**: 10-28 local fixes to delivered content were reverted by later template waves — vsp table (H-5), pm.md dup key (H-7), and the CHANGELOG-wave-entry duty (H-2) all regressed via the 0.29.0/0.30.0 deliveries. Local-only fixes to delivered files regress unless adopted upstream | PM (synthesis) | multiple | systemic | Every re-fix this session carries a LOCAL-PATCH(upstream-request) marker or an upstream ticket; upstream adoption via the filed tickets is the durable cure |

### 🟢 Moderate (fix within 2 weeks)

| # | Issue | Agent | File:Line | Class | Fix |
|---|-------|-------|-----------|-------|-----|
| M-1 | Graft-era allow remnants: `Bash(node dist/cli.js:*)` tracked + 4 graft-era entries incl. `Bash(npx graft:*)` (fetch-and-execute) in the untracked machine-local settings.local.json | devops-admin + security-monitor | .claude/settings.json:167, .claude/settings.local.json | one-time | **Fixed this session** (tracked line was already removed by the in-flight migration — verified; local file pruned) |
| M-2 | opencode.json still undocumented — M-7 from 10-28 now surviving its second migration; user decision still pending | architect | opencode.json, docs/co-abap.context.md | systemic | **Open — needs user decision** (one-line doc anchor or removal) |
| M-3 | L0-design references unqualified in delivered content: code comments + .gitignore cite workspace-root design paths; AGENTS.md §3.7.5 backtick citation immune to link transforms | architect + i18n-specialist | scripts/lib/self-managed-tools.ts:12, scripts/lib/trail-block-parity.ts:25, .gitignore:146,155, AGENTS.md §3.7.5 | script-gap | §3.7.5 qualified + LOCAL-PATCH(U-20261112-017) this session; convention upstream **U-20261112-017** |
| M-4 | vsp Deployed Binary table contradiction regressed (was fixed 10-28, reverted by waves) | read-only-analyst | docs/co-abap.context.md:199-208 | one-time | **Re-fixed this session** (restored from commit 553bb89; wave-revert class H-8) |
| M-5 | The 7 delivered skill records are L0-perspective and structurally invisible to Check MV (single/zero Metadata blocks) | read-only-analyst | docs/lifecycle/skills/{7 files} | systemic + script-gap | **Rewritten this session** (part of H-1 batch); upstream **U-20261112-011** |
| M-6 | SCRIPTS.md header count-prose rotted again ("130 of 205" vs actual 222 rows) | read-only-analyst | scripts/SCRIPTS.md:3 | systemic | **Fixed this session** (non-rotting phrasing) |
| M-7 | CHANGELOG same-entry duplication passes the new lint (2026-10-28 entry in wave-log layer + ### Changed) | read-only-analyst | CHANGELOG.md:5,35 | script-gap | **Deduped this session**; lint extension upstream **U-20261112-019** |
| M-8 | pm.md duplicate `last_updated` key shape returned (values now converged; shape still violates the one-key convention) | read-only-analyst | agents/pm.md:11,15 | one-time | **Removed again this session** (wave-revert class H-8) |
| M-9 | REQ-002 (ZSFLIGHT_REPORT) gate ruling had no DEC record | read-only-analyst | docs/decisions/ | one-time | **Record created this session** (DEC-20261112-01) — with an honest twist: the QA report shows the gate was never fully adjudicated (ATC NOT RUN), so the record rules it **rework/not-passed** rather than fabricating a pass. **Follow-up for the user**: run the outstanding ATC scan or close REQ-002 deliberately |
| M-10 | MEMORY.md two dead index rows (2026-10-22, 2026-10-26 — files absent everywhere) | read-only-analyst | memory/MEMORY.md:14,18 | one-time | **Removed this session** (documented cleanup precedent) |
| M-11 | No CI-reference existence check — prune deleted a ci.yml-referenced script (T-20261108-008 class, twice) | devops-admin | scripts/verify-scripts.ts, .github/workflows/ci.yml | script-gap | Upstream **U-20261112-014** (validator-hardening) |
| M-12 | mcp-proxy-routing gate blind to opencode.json and .claude/settings.json mcpServers | devops-admin | scripts/validate-abap-platform-parity.ts:41-47 | script-gap | Upstream **U-20261112-015** |
| M-13 | .codex/hooks.json is a dead stub while SCRIPTS.md documents codex gates as wired; PM Gateway gates never run for Codex sessions here | devops-admin | .codex/hooks.json, scripts/SCRIPTS.md:242 | systemic | Upstream **U-20261112-018** |
| M-14 | .gitattributes trailing `* text=auto eol=lf` (last-match-wins) kills the earlier .cmd/.bat CRLF intents | devops-admin | .gitattributes (last line) | one-time | **Fixed this session** (line + its comment removed) |
| M-15 | Ghost script sync-mcp.ts documented as active; MCP "3 locations" note stale (now 6 surfaces) | i18n-specialist | docs/co-abap.context.md:139,218 | systemic | **Fixed this session** (rows removed, parity-gate drift control documented) |
| M-16 | PROMOTION_CHECKLIST.md evidence chain dead: cited ADRs/report don't exist here; variant.json skills[] claim false | i18n-specialist | PROMOTION_CHECKLIST.md:14+ | systemic | **Fixed this session** (workspace-root qualifications; counts sourced from VERSION_MANIFEST) |
| M-17 | .trail/hook.cjs supply-chain trust: fail-open, no secrets/network observed, but resolves hook modules from the highest-versioned installed package (unpinned) and injects vendor context | security-monitor | .trail/hook.cjs:108-160 | systemic | **SECURITY.md note added this session**; user option: pinned TRAIL_HOME install |
| M-18 | Skill Step 0 references scripts/review-baseline.ts which is not delivered to L3 ("Module not found" every detached review) | PM | skills/project-review/SKILL.md | script-gap | Note recorded; fold into the next skill upgrade cycle |

### ℹ️ Low / Improvements

| # | Issue | Fix |
|---|-------|-----|
| L-1 | Zero-width char at scripts/dispatch-parallel.ts:166:28 is a deliberate U+FEFF BOM-strip regex literal, not contamination; file is settings-deny-protected and L0-owned | upstream: replace literal with `\uFEFF` escape (escapes the scanner without behavior change) |
| L-2 | `"footerLinksRegexes": []` empty-array leftover in .claude/settings.json (L0 drops the key) | cosmetic; fold into next settings touch |
| L-3 | Merged local PR branches linger (cosmetic) | optional cleanup |

### ✅ Strengths

- The staged graft→trail MCP diff is a faithful implementation of the L0 corrective-pass design — non-graft servers preserved on all five surfaces, trail wiring byte-consistent with L0, `bunx` registry-fetch replaced by the local `trail` binary (supply-chain improvement).
- The 0.29→0.30 prune incident (T-20261108-008) was root-caused and fixed at the upgrader (v1.95+/1.100.0), not patched ad-hoc; the restore commit (c2ffd85: file + registry row + manifest + memory log) is exemplary.
- Honest machine signals work end-to-end: U-011 made the 42-record gap visible; U-006 tolerance keeps agent health truthful; this session closed both gaps and the audits went to zero warnings without weakening any check.
- Approval chain untouched by the migration: /dev/tty HMAC approvals, deny matrix intact (approve/integrity/proxy/approval.key/policy source write-protection), zero secrets in recent diffs, `.env.sample` placeholders only.
- CI hygiene strong: SHA-pinned actions, contents:read, persist-credentials:false, gitleaks by digest; validate-abap-platform-parity passes 6/6 on the uncommitted migration tree.
- Ratchet verdict: of the 10-28 report's 22 findings, 14 verified absorbed (H-3/H-6/H-8/H-9/H-10/M-3/M-4/M-6/M-8/M-9/M-11/M-12 + machine absorption of docs-link/CI gaps); 4 recurred via wave-reversion (now understood as a class, H-8); the rest are tracked in this report.

## Domain Summary

| Slot | Domain | Executor | Critical | High | Moderate |
|------|--------|----------|----------|------|----------|
| A | Architecture + Scaffolding | architect (dispatched) | 1 | 3 | 2 |
| B | Standards + Lifecycle | read-only-analyst (dispatched) | 0 | 3 | 5 |
| C | Automation | devops-admin (dispatched) | 0 | 2 | 5 (+WARN analyses) |
| D | Documentation + Security | i18n-specialist + security-monitor (dispatched) | 0 | 2 | 5 |

After dedup: **1 Critical, 8 High (incl. 1 meta), 18 Moderate, 3 Low** — plus the machine baseline's own 42-WARN signal (cured in-session).

## Action Wiring

Upstream tickets filed 2026-11-12: **U-20261112-010** (trail fleet-standard delivery gap + delivered-side detector), **-011** (skill lifecycle-records delivery gap + MV-invisible delivered records), **-012** (encoding-utils zero-EOL false positive), **-013** (hook-target existence gate), **-014** (CI-reference existence check, validator-hardening), **-015** (mcp-proxy-routing coverage: opencode.json + settings.json mcpServers), **-016** (co-abap.context.md content rot family: 68-anchor repoint + DA-1..DA-8 restoration), **-017** (L0-design reference qualification convention), **-018** (Codex hooks stub doctrine), **-019** (CHANGELOG same-entry-dup lint blind spot).

| Route | Items |
|-------|-------|
| Fixed this session | C-1, H-1 (49 records), H-2 (backfill), H-4 (mitigation), H-6 (repoint), H-7 (restore), M-1, M-3 (§3.7.5), M-4, M-5, M-6, M-7 (dedupe), M-8, M-9 (record created — honest rework ruling), M-10, M-14, M-15, M-16, M-17 (SECURITY.md note) |
| Upstream (filed) | C-1/H-8 durable cure + M-3/M-5/M-7/M-11/M-12/M-13/M-18 families → U-20261112-010…-019 |
| Open — user decision | M-2 (opencode.json document vs remove — third carry-over), M-9 follow-up (REQ-002 ATC scan outstanding or deliberate closure), M-17 option (pinned TRAIL_HOME), H-3 (ledger consolidation — local task, next session) |
| Not pursued | L-1 (deny-protected L0 file), H-2 standing automation (already tracked in the delivery-bookkeeping engine upstream) |

## Fix Round (2026-11-12)

| Executor | Scope |
|----------|-------|
| remediation specialist (15 items + Row 0) | design doc `docs/designs/2026-11-12-project-review-remediation-design.md` (spec registered); instruction-doc trail swaps ×5; CHANGELOG backfill + dedupe; 5 fixture newlines; .gitattributes catch-all removed; co-abap.context.md (vsp table restore, ghost sync-mcp removal, DA-1..DA-8 verbatim restore from c871e63, 68+9 anchor repoints); AGENTS.md §3.7.5 qualification; pm.md dup key removal; SCRIPTS.md prose; DEC-20261112-01 (REQ-002 — honest rework ruling); MEMORY.md dead rows; PROMOTION_CHECKLIST evidence pointers; SECURITY.md trail trust note; settings.local.json prune |
| lifecycle-records specialist | 49 skill records: 28 ported+adapted from workspace seeds, 14 authored from git dates (no fabricated history), 7 rewritten to project-local dual-Metadata form; skill-graph regenerated per the audit's prescribed remedy |

Notable honest deviations: REQ-002 record rules the gate **rework/not-passed** (QA report shows ATC NOT RUN — fabricating a pass was rejected); DA-1..DA-8 restored from git history rather than re-authored; ITEM 2 (dist/cli.js wildcard) was already satisfied by the in-flight migration — verified, not double-edited.

## Verification (Step 6, post-fix)

| Check | Result |
|-------|--------|
| `bun scripts/audit.ts` | ✅ PASS ("All checks passed") |
| `bun scripts/validate-abap-platform-parity.ts` | ✅ 6/6 |
| `bun scripts/skill-lifecycle-audit.ts` | ✅ **50 skills, 0 warnings** ("All 50 skills healthy") |
| `bun scripts/agent-lifecycle-audit.ts` | ✅ 21/21 healthy |
| `bun scripts/verify-scripts.ts --verify` | ✅ 209 OK |
| `bun run typecheck` / `bun test scripts` | ✅ clean / 213 pass 0 fail |
| `bun scripts/validate-decisions.ts` | ✅ 0 errors |
| Acceptance greps | graft:start = 0 and trail:start = 1 in all 5 instruction docs; dead vsp anchor = 0 live citations; pm.md single last_updated; fixtures end with newline |

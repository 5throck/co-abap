# Project Review — co-abap — 2026-10-28

**Date**: 2026-10-28
**Scope**: L3 variant project (co-abap) — full review (T-01 user request)
**Method**: Machine battery + 4 domain review slots. Slots A (Architecture+Scaffolding, architect persona) and B (Standards+Lifecycle, read-only-analyst persona) ran as dispatched read-only subagents; Slots C (Automation, devops-admin persona) and D (Documentation+Security, i18n-specialist+security-monitor personas) were executed by PM role-play after the Agent tool became unavailable (4 background dispatches rejected by user concurrency limit; a retry failed on quota — the skill's declared fallback). Cross-domain dedup applied by PM.

> Analysis only — no files modified in this report.

## Baseline (Step 0)

| Check | Result |
|-------|--------|
| `bun scripts/audit.ts` | ✅ PASS — 1 WARN (shell-injection heuristic `scripts/dev-sync.ts:1625`), 1 SKIP (design-lint: configured scan root absent, explicit fallback) |
| `bun scripts/agent-lifecycle-audit.ts` | 21 agents scanned, 0 FAIL, 21 WARN (all: frontmatter `last_updated` older than last git commit) |
| `bun scripts/skill-lifecycle-audit.ts` | 49 skills healthy |
| `bun scripts/verify-scripts.ts --verify` | ✅ 191 registered scripts verified, 0 warnings |
| `validate-templates.ts` / `propagate-to-templates.ts` / `review-baseline.ts` | N/A — L0-only tooling, absent in this detached L3 checkout (not counted as pass or failure) |
| `bun run typecheck` | ✅ clean |
| `bun test scripts` | ✅ 213 pass / 0 fail |

base-map MCP: not available (enhancer — skipped).

## Findings

### 🔴 Critical (fix immediately)

None. No security exposure, no data-loss path, no broken machine gate.

### 🟡 High (fix within 1 week)

| # | Issue | Agent | File:Line | Class | Fix |
|---|-------|-------|-----------|-------|-----|
| H-1 | SECRET_ERE secret-pattern patch lost from hooks again; `scripts/lib/secret-patterns.ts` is orphaned (sole importer is SCRIPTS.md), whose header + `SCRIPTS.md:140` falsely claim hook consumers; `.gitleaks.toml` has no equivalent custom rule; headerless lib escapes Check A version comparison | architect | `scripts/lib/secret-patterns.ts:4-6`, `scripts/SCRIPTS.md:140`, `scripts/hooks/pre-push.ts` (v1.6.0, no secret scan) | systemic + script-gap | Port SECRET_ERE to `.gitleaks.toml` custom rule (upgrade-safe) or re-apply into hooks with `LOCAL-PATCH(upstream-request: <id>)`; correct ledger claims; teach Check A to flag SCRIPTS.md rows whose files lack `@version` |
| H-2 | Template upgrade waves 0.20.1 and 0.22.0 landed with no CHANGELOG [Unreleased] entries (newest entry 2026-10-13; `template-version.txt` upgraded=2026-10-27) | architect | `template-version.txt:5`, `CHANGELOG.md` | systemic | Backfill [Unreleased] entries for both waves; upstream: upgrade-project deliveries should emit a changelog entry |
| H-3 | `LOCAL-PATCH(upstream-request: pending)` marker never converted to a UR id and absent from the upstream ledger | architect | `scripts/co-abap/install-vsp.ts:3` | one-time | Adjudicate: file the upstream request and stamp the ID, or retire the marker if the script is L3-owned payload (then no marker per pm.md) |
| H-4 | Upstream bookkeeping fragmented across two incompatible ledgers (`docs/upstream-fix-list.md` §-series vs UR-1..UR-6), statuses unreconciled after 0.18.0/0.20.1/0.22.0 waves (some §-items already promoted into delivered template) | architect | `docs/upstream-fix-list.md` vs CHANGELOG UR-1..UR-6 references | systemic | Consolidate into one UR-keyed ledger; reconcile after every upgrade using `scripts/helpers/local-patch-scan.ts` output as source list |
| H-5 | Deployed vsp binary contradiction: Tech Stack says `vsp` v2.60.0; Deployed table says `vsp.exe` v2.38.1 (2026-04-07); actual root binary is `vsp` (Oct 11) | architect | `docs/co-abap.context.md:23,37` vs `:199-208` | one-time | Update the Deployed Binary table (name `vsp`, current pinned version, real build/date); fix the upgrade-instruction filename |
| H-6 | dev-sync propagates agent frontmatter changes (bumps `version`) but never refreshes nested `lifecycle.last_updated` → all 21 lifecycle-audit WARNs are genuine; sync-subject vocabulary ("chore: workspace sync") also not in the audit's sync-only exemption patterns (correctly so — these commits carry content) | read-only-analyst | `scripts/dev-sync.ts:21,47,319`, `scripts/agent-lifecycle-audit.ts:671-688` | systemic + script-gap | dev-sync bumps nested `last_updated` when it modifies agent frontmatter; do NOT blanket-exempt the sync subject family |
| H-7 | `agents/pm.md` carries duplicated `last_updated` keys with divergent values (top-level 2026-10-27 at :11 vs nested lifecycle 2026-10-10 at :15); audit reads the first match | read-only-analyst | `agents/pm.md:11,15` | one-time | Drop the top-level key (other 20 agents use only the nested form); add duplicate-key check to `validate-agents.ts` |
| H-8 | `pm-gateway-workflow.md` — the doc AGENTS.md orders the PM to read before every dispatch — routes Phase Determination to four non-variant agents (automation-engineer, docs-writer, security-expert, scaffolding-expert) with no L0 qualifier, unlike sibling `workflows.md` which carries the qualifier convention | read-only-analyst | `docs/governance/agents/pm-gateway-workflow.md:20-24,28,111,117,150,152` | systemic | Add the workflows.md-style "(L0 workspace root)" qualifier or re-map rows to the co-abap roster |
| H-9 | `decisions/gates.yaml` DG-ABAP-01/02 declare `record_kind: DEC` but no DEC records exist for their rulings (delivered QA-gate passes live only in CHANGELOG/reports) | read-only-analyst | `decisions/gates.yaml:9-36`, `docs/decisions/` (single unrelated record) | one-time (process) | Backfill DEC records for REQ-001/REQ-002 gate adjudications, or amend `record_kind` if report-recording is intentional |
| H-10 | CHANGELOG [Unreleased] violates single-section-per-category: 3× Added, 4× Changed, 3× Fixed (+Security, Removed), with 2026-10-13 block appended after 2026-10-11 entries (per-wave append habit) | read-only-analyst | `CHANGELOG.md:12,17,21,24,27,30,34,37,41,64,101,127` | systemic | Consolidate to one block per category, newest-first; add lint rejecting duplicate category headings inside a release section |

### 🟢 Moderate (fix within 2 weeks)

| # | Issue | Agent | File:Line | Class | Fix |
|---|-------|-------|-----------|-------|-----|
| M-1 | L0-managed AGENTS.md text references L0-only artifacts missing in this L3 checkout: COMMON-AGENTS block claims 8 skills are "absent from root skills/" (all 8 exist) and cites `docs/templates/common-contract.json` (does not exist); §3.7.5 links `docs/designs/2026-08-16-governance-backlog-design.md` (broken relative link, 1 of 100 spot-checked) | architect + i18n-specialist (PM) | `AGENTS.md:493`, `AGENTS.md` §3.7.5 | systemic | Upstream: scope L0-only notes/links to L0 or deliver the targets; local channel: clarifying line in co-abap.context.md |
| M-2 | VARIANT-PHASE-GATE table ships without a header row; i18n-specialist row renders "Phase ?" (empty frontmatter phases) | architect | `AGENTS.md:343-364` | systemic (generator) | Upstream: emit header inside the block; locally pin i18n-specialist phases in frontmatter |
| M-3 | Duplicated WORKSPACE-MANAGED block ID `tier-model-mapping` (two complete pairs in §3.6) — merge-by-ID upgrades may duplicate/misplace the second body | architect | `AGENTS.md:370-377` | one-time | Give the note a distinct ID (`tier-model-mapping-note`) at next content touch |
| M-4 | Stray hygiene artifacts at root (untracked, gitignored): `CHANGELOG.md.tmp` (0 B), `CLAUDE.md.pre-skeleton.bak` (3.3 KB, leftover from the succeeded Oct 26/27 skeleton wave) | architect | repo root | one-time | Delete both; upstream: skeleton merge removes its `.bak` after verified success |
| M-5 | docs/context.md "Standard Root Files" list omits CODEX.md and HERMES.md, both mandated by the same file's Supported Surfaces table and present at root | architect | `docs/context.md:334` vs `:501-514` | systemic | Upstream template fix (context.md is pipeline-managed, locally immutable) |
| M-6 | `variant.json` lacks the optional `promotionChecklist` pointer (workflows.md:153 expects it truthful/linked) | architect | `variant.json` | one-time | Add `"promotionChecklist": "PROMOTION_CHECKLIST.md"` at next variant.json touch |
| M-7 | `opencode.json` (graft MCP for opencode editor) — ungoverned 9th-surface config, permitted under "Configuration, tooling files" but referenced by no doc | architect | `opencode.json` | one-time | Document in co-abap.context.md MCP section, or remove if opencode is unused (user decision) |
| M-8 | SCRIPTS.md header prose ("lib/ and helpers/ intentionally excluded") contradicts its own registry (115 of 191 rows are subdirectory files); 4 real `scripts/co-abap/` dispatch wrappers unregistered; no reverse disk→registry check | read-only-analyst | `scripts/SCRIPTS.md:1-3` vs registry; `scripts/co-abap/{dispatch,dispatch-serial,dispatch-parallel,retry-handler}.ts` | systemic + script-gap | Rewrite header prose to match reality; register the 4 rows; add reverse check to verify-scripts |
| M-9 | Skill lifecycle-record check (LC) is gated to `IS_WORKSPACE_ROOT` → never runs here; 42 of 49 active skills have no `docs/lifecycle/skills/` record while the audit prints "49 skills healthy" | read-only-analyst | `scripts/skill-lifecycle-audit.ts:766,798-805` | script-gap / design ambiguity | Document L3 scope in the baseline, or relax LC to a project-level WARN so health is not over-claimed |
| M-10 | AGENTS.md §3 subsection numbering out of document order (3.1 → 3.7 → 3.6 → 3.7.5) after ADR-0090 extraction | read-only-analyst | `AGENTS.md:294,366,380` | one-time | Renumber survivors sequentially or reorder bodies to match the prose list |
| M-11 | VERSION_MANIFEST agents Last-Modified one commit stale for pm and i18n-specialist (manifest regenerated at 2026-10-27T18:41Z, c1cd5ad landed one minute later) | read-only-analyst | `docs/VERSION_MANIFEST.md` (Agents table) | one-time | Regenerate at next commit; consider having the drift gate compare the Last-Modified column |
| M-12 | MEMORY.md session index: 29 of 34 rows bare (files moved to `memory/archive/` but never relinked), duplicate 2026-10-11 rows, junk summary `--help`, non-chronological stretch rows 15-21 | read-only-analyst | `memory/MEMORY.md:11-23` | systemic | `archive-memory.ts` relinks index rows to `archive/`; dedupe; suppress junk session summaries at dev-sync source |

### ℹ️ Low / Improvements

| # | Issue | Agent | File:Line | Class | Fix |
|---|-------|-------|-----------|-------|-----|
| L-1 | dev-sync.ts:1625 shell-injection WARN assessed: low-risk near-false-positive — bun `$` templates pass interpolations as exec argv (no shell parsing); residual risk is only `gh api` path/query composition from the origin URL regex match + branch name (non-destructive, single-purpose command) | devops-admin (PM) | `scripts/dev-sync.ts:1625` | one-time | Char-allowlist `branch`/slug before interpolation, or accept with a documented rationale comment at the site |
| L-2 | `designLint.scanRoots` = `["templates/co-design/playground/src"]` is L1-delivered schema text that can never exist in this L3 checkout → gate permanently SKIPs (handled gracefully and explicitly by audit v2.56.0 fallback U-20261026-006) | devops-admin (PM) | `docs/workspace-schema.json:623` | systemic (inherited config, by design) | Upstream: make designLint.scanRoots variant-overridable; no local action needed |

### ✅ Strengths

- Machine hygiene: audit.ts PASS; typecheck clean; 213/213 unit tests; registries exactly in sync (49 skills, 191 scripts).
- Inheritance-marker discipline otherwise excellent: all VARIANT-* blocks paired and consistent; pm.md WORKSPACE-MANAGED body intact; no orphaned LOCAL-PATCH markers beyond H-3/H-1.
- Every non-standard root entry resolves to a governing reference (decisions/, governance/, process/, procedures/, deliverables/, scratch/, graft/, vsp, scripts-snapshot.json) — no orphaned directories; root .md compliance clean.
- PROMOTION_CHECKLIST.md is a model ADR-0099 migration-admission record.
- Variant audit-hook contract implemented robustly; no local edits to core sync/audit scripts.
- 21 agents ↔ 21 lifecycle records, coherent statuses; sole DEC record exemplary.
- Hook wiring fully verified: core.hooksPath=.githooks, 5 shell wrappers → TS logic, all 15 settings.json hook commands resolve to existing files.
- CI: least-privilege (`contents: read`), SHA-pinned actions with rationale comments, timeouts, full-history fetch justified.
- MCP approval chain matches its documentation: /dev/tty human confirmation (first-6-chars, no stdin fallback), HMAC key 0600 outside the workspace; comprehensive deny matrix (sap-approve, sap-integrity, sap-mcp-proxy, approval.key, policy/lib source write-protection).
- No secrets in recent diffs (only a documentation placeholder line being removed); README.md/README_ko.md structurally parallel (30/30 heading groups); language policy clean with the single documented Korean exception.

## Domain Summary

| Slot | Domain | Executor | High | Moderate | Low |
|------|--------|----------|------|----------|-----|
| A | Architecture + Scaffolding | architect (dispatched) | 5 | 7 | 0 |
| B | Standards + Lifecycle | read-only-analyst (dispatched) | 5 | 5 | 0 |
| C | Automation | devops-admin (PM role-play) | 0 | 0 | 2 |
| D | Documentation + Security | i18n-specialist + security-monitor (PM role-play) | 0 | 0 (1 merged into M-1) | 0 |

After cross-domain dedup: 10 High, 12 Moderate, 2 Low, 0 Critical. Ratchet note vs 2026-10-10 review: prior script-gap items (docs-link gate, CI test/typecheck, version/date bump check, CHANGELOG format check, shared secret-pattern list) landed as machine checks — the docs-link and CI gaps are now closed; H-1/M-8/M-9/H-6 are new classes the current validators still miss.

## Action Wiring

`bun scripts/ticket.ts` is workspace-root only (absent in this L3 project) — deferred items are recorded here and in `memory/2026-10-28.md`.

| Route | Items |
|-------|-------|
| Fix now (pending user approval) | H-1 (.gitleaks.toml rule + ledger corrections), H-2 (backfill), H-5, H-6 (dev-sync change — needs Design Gate), H-7, H-10, M-3, M-4, M-6, M-8, M-10, M-11, M-12 |
| Needs user decision | H-3 (file upstream vs retire marker — resolved: filed as U-20261028-015, marker stamped), H-9 (backfill DEC vs amend gates.yaml), M-7 (document vs remove opencode.json) |
| Upstream (template-managed / L0-origin) | Filed 2026-10-28: U-20261028-004 … U-20261028-015 — see Addendum below |
| Validator-hardening (script-gap) | H-1 (Check A headerless-file + secret-pattern enforcement), H-6 (dev-sync last_updated bump), M-8 (reverse registry check), M-9 (LC project-level WARN), H-10 (CHANGELOG duplicate-category lint) |

Note: H-1, H-6, M-8, M-9 hardening items live partly in L0-owned validators (dev-sync.ts, skill-lifecycle-audit.ts, verify-scripts.ts core policies) — local patches require upstream reports per the LOCAL-PATCH duty.

## Verification

Not applicable — analysis-only session; no fixes applied. Fix round and post-fix re-audit to follow upon user instruction.

---

## Addendum — Upstream Requests Filed (2026-10-28)

The ai-workspace-upstream channel was used to file the L1/L2-origin findings (12 requests, U-20261028-004 … U-20261028-015). L3-local-only items remain routed per the Action Wiring table above and are not filed upstream (pm.md: "Do not report L3 problems").

| Ticket | Finding(s) | Layer | Subject | Status at filing |
|--------|-----------|-------|---------|------------------|
| U-20261028-004 | H-1, H-4, H-3 (marker evidence) | L1 | Upgrade waves overwrite LOCAL-PATCH'd hooks (secret-pattern loss) and leave local-patch bookkeeping unreconciled | backlog/inbox |
| U-20261028-005 | H-2 | L1 | Upgrade deliveries emit no CHANGELOG entry | backlog/inbox |
| U-20261028-006 | H-6 | L1 | dev-sync does not bump nested lifecycle.last_updated when propagating agent frontmatter changes | waiting/ready |
| U-20261028-007 | H-8 | L1 | pm-gateway-workflow.md routes to non-variant agents without L0 qualifier | backlog/inbox |
| U-20261028-008 | M-1 | L1 | AGENTS.md L0-only text references L0-only artifacts (COMMON-AGENTS skills note, §3.7.5 design-doc link) | waiting/ready |
| U-20261028-009 | M-2 | L1 | VARIANT-PHASE-GATE block lacks header row; "Phase ?" placeholder (flagged needs_human_review) | backlog, flagged |
| U-20261028-010 | M-5 | L1 | docs/context.md Standard Root Files list omits CODEX.md/HERMES.md | waiting/ready |
| U-20261028-011 | M-9 | L1 | skill-lifecycle-audit LC check workspace-root-gated; L3 health over-claimed | waiting/ready |
| U-20261028-012 | M-8 | L1 | verify-scripts lacks reverse disk→registry check; SCRIPTS.md header prose contradicts registry | waiting/ready |
| U-20261028-013 | H-10 (hardening) | L1 | Changelog gate lacks duplicate-category lint | waiting/ready |
| U-20261028-014 | L-2 | L1 | designLint.scanRoots not variant-overridable; non-UI variants permanently SKIP (project_soft_cap) | backlog |
| U-20261028-015 | H-3 | L2 | install-vsp.ts guidance suggests export SAP_PASSWORD; pending marker now stamped with this ID | backlog, project_soft_cap |

The pending marker in `scripts/co-abap/install-vsp.ts` was stamped with U-20261028-015 per the LOCAL-PATCH duty. Fix-round work that lands local patches for tickets U-20261028-004/-005/-007/-009/-010/-012/-013/-014 must carry `LOCAL-PATCH(upstream-request: <id>)` markers next to the patched lines and must not be removed until `upstream_request_status` shows `fixed` and the next `upgrade-project` runs.

# Upstream Fix Ledger — co-abap (consolidated)

This file is THE single consolidated upstream ledger for this project. It
supersedes the former `§`-numbered item series (header previously dated
2026-08-24) by folding that series, the UR-1..UR-6 series (2026-10-10 review
cycle), and the upstream ticket waves (U-20261028-*, U-20261112-*) into one
place, keyed to the live `LOCAL-PATCH(upstream-request: …)` markers that
`scripts/helpers/local-patch-scan.ts` enumerates.

- Consolidated: 2026-11-13 (remedy for the 2026-11-12 review finding H-3,
  re-flagging the 2026-10-28 finding H-4; design
  `docs/designs/2026-11-13-upstream-ledger-consolidation-design.md`).
- Old `§`-numbers are retired; they survive below only as text in the
  historical index. New items enter this ledger by upstream ticket id
  (`U-YYYYMMDD-NNN`) and, for pre-ticket local work, by the UR- convention
  recorded in the 2026-10-10 report (`docs/reports/2026-10-10-project-review-full.md:124`).
- Statuses are store-verified where a store record exists; anything without
  store or code evidence is marked **unverified** rather than guessed.

## 1. Historical index — old §-series final dispositions

Every former §-item was re-adjudicated against the current codebase before its
final disposition was written (evidence column names the verifying artifact).

| Old § | Subject (original wording, abridged) | Final disposition | Evidence (checked 2026-11-13) |
|---|---|---|---|
| §1 | dev-sync.ts 7 Bun-Shell typing errors | RESOLVED upstream (ai-workspace-standards PR #631), propagated 2026-08-24 | File header (pre-consolidation state); CHANGELOG 2026-08-24 entry |
| §2 | upgrade-project local-patch overwrite hazard (sha256 patch-ledger proposal) | ADDRESSED upstream — different mechanism than proposed: upgrade now pre-scans LOCAL-PATCH markers and reports per-file protection (`granted` / `protected` / `no delivery`), with a MARKER_LOSS delivery guard, A1 CONFLICT skip, and explicit `--disposition adopt-template` grants; merge-aware delivery preserved project-only `.gitleaks.toml` [[rules]] (mergeGitleaksToml) and `.gitattributes` lines (mergeGitattributes). The sha256-ledger variant itself was not adopted. Related ticket U-20261028-004 (done, local-only). | L0 `scripts/upgrade-project.ts` imports `scanLocalPatches` (:1250) and prints the LOCAL-PATCH report before any delivery write (:3433 block); ticket store `U-20261028-004` result |
| §3 | `scripts/co-abap/install-vsp.ts` shebang order | RESOLVED — fixed locally 2026-08-23, then fixed at the source: delivered template copy v1.2.0 (upstream PR #1700, ticket U-20261028-015 done/fixed) carries the shebang on line 1 | `scripts/co-abap/install-vsp.ts:1-2` (`#!/usr/bin/env bun`, `@version 1.2.0`, header cites U-20261028-015) |
| §4 | audit.ts L0-only `./validators/index.ts` literal import breaks variant strict tsc (TS2307) | RESOLVED upstream — delivered audit.ts switched to a non-literal specifier (`new URL('./validators/index.ts', import.meta.url).href` behind the existsSync guard); the local `@ts-expect-error` workaround is no longer needed | `scripts/audit.ts:273-276` (v2.21.1 note) and `:970-976` |
| §5 | audit.ts nul-lint `stripComment` not CRLF-safe | RESOLVED upstream — `stripComment` now prepends `.replace(/\r$/, '')` (v2.21.1, "ported from co-abap 2.21.2") | `scripts/audit.ts:2823-2827` |
| §6 | dev-sync `--spec-exempt` inert inside the pipeline (single-argv Bun `$` interpolation) | RESOLVED upstream — the env-pass mechanism (local 1.7.2 fix) was adopted: exemption forwarded via `SYNC_SPEC_EXEMPT` in `.env(...)`, both at L0 and in the delivered copy | `scripts/dev-sync.ts:364-366, 1008-1011`; L0 `scripts/dev-sync.ts:1177` |
| §7 | country-scoped prune never runs on the upgrade path | RESOLVED upstream — upgrade-project wires the registry-driven prune on the upgrade path (prune-country-scoped-assets v0.4.0; upgrade-project v1.10.1 country-profile awareness with an `isLocallyModified` conflict guard); observed working in this project (2026-09-26/09-21 upgrades kept the 6 k-* skills out, country=none) | L0 `scripts/upgrade-project.ts:704, 1067, 1172, 7366`; CHANGELOG 2026-09-26 entries |
| §8 | propagation `domains.skills` carries only `*/SKILL.md`, dropping multi-file skill assets on L0→L1 propagation | OPEN (unresolved upstream) — L0 `scripts/propagation-map.json` still declares `include_pattern: "*/SKILL.md"` with no asset glob (checked 2026-11-13); no upstream ticket on record. The delivery end was since mitigated (upgrade-project whole-directory sub-file deliveries since the 2026-09-21 wave), but the L0→L1 propagation gap itself is unfixed — **needs an upstream filing** | L0 `scripts/propagation-map.json:122-130` |
| §9 | templates/common graft helpers re-baked machine path (fleet-wide regression vector) | SUPERSEDED — subject removed by the graft→trail migration (2026-10-31/11-08; 0.29.0→0.30.0 waves, local completion re-landed in the PR #247-era batch): `.claude/helpers/` no longer exists, the graft binary is uninstalled, `.trail/hook.cjs` + `.trail/statusline.cjs` carry the context graph, and the trail MCP server is registered across the six MCP surfaces. The baked-constant hazard no longer applies. Family tickets: U-20261112-010-class trail items (see §4 below) | `.claude/helpers/` absent (ls); `which graft` → not found; `.trail/` contents; `SECURITY.md` trail-hook note |

Also folded here (never §-numbered, frequently mis-cited as "§2"): the
**SECRET_ERE pre-push hook patch** (2026-10-12 wave, PR #200-era). CLOSED —
hook files are template-managed again and the custom secret patterns moved
into the project `.gitleaks.toml` `[[rules]]` (merge-aware delivery preserved
them; the 7ae2741-era workspace sync, 2026-10-30, delivered the rule set;
`grep SECRET_ERE scripts/hooks/ .gitleaks.toml` → no hits). The orphaned
`scripts/lib/secret-patterns.ts` was retired; the extension-point note
("custom secret patterns belong in `.gitleaks.toml`, never in hook files") was
queued upstream in the 2026-10-29 mechanical batch per ticket
U-20261028-004 (done, local-only).

2026-11-12: U-20261112-010/-011 left the live upstream store overnight after
filing (lookup not found; believed merged into same-day co-develop requests);
re-filed 2026-11-13 as U-20261113-002/-003 and all live LOCAL-PATCH markers
migrated.

## 2. Live LOCAL-PATCH markers

Generated from `scripts/helpers/local-patch-scan.ts` (`scanLocalPatches('.')`),
2026-11-13. The scanner strips inline-code spans and skips the marker-protocol
surfaces (`scripts/hooks/pre-commit.ts`, the scanner itself, L0
`scripts/upgrade-project.ts`, `scripts/SCRIPTS.md`), so the counts below are
live content markers only. **51 occurrences / 50 files.**

| Marker location | Upstream id | Occurrences | Status |
|---|---|---|---|
| `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `HERMES.md`, `CODEX.md` (CODEX ×2) | U-20261113-002 | 6 | U-20261113-002 (re-file of the vanished U-20261112-010) — waiting/ready |
| `docs/lifecycle/skills/*.md` (35 records) | U-20261113-003 | 35 | U-20261113-003 (re-file of the vanished U-20261112-011) — backlog/inbox (path_not_template_managed flag) |
| `docs/co-abap.context.md` (top-of-file sub-fix list) | U-20261112-016 | 1 | review (store-verified 2026-11-13) |
| `AGENTS.md` §3.7.5 (workspace-root design citation) | U-20261112-017 | 1 | review (store-verified 2026-11-13) |
| `CHANGELOG.md` (0.20.1/#221 and 0.22.0/#224 retrospective backfill entries) | U-20261028-005 | 2 | done (archived; adjudicated local-only) |
| `skills/project-review/SKILL.md` + 5 platform mirrors (`.agents/`, `.claude/`, `.codex/`, `.gemini/`, `.hermes/`) | UR-2 | 6 | superseded upstream — L0/L1/L2 skill sources no longer carry the legacy `.claude/template-version.txt` text at all; marker stays until the next delivery refreshes the mirrors |

Re-run this scan after every upgrade (§5) and update this table in place.

## 3. Ticket waves

### 3.1 UR-1..UR-6 (2026-10-10 review cycle)

Definitions of record: `docs/reports/2026-10-10-project-review-full.md:124`.
The upstream MCP channel was unavailable that session, so UR-1..UR-6 were
recorded via the CHANGELOG fallback (2026-10-10 entry, #191) — none of the six
has an upstream store ticket under these names.

| UR | Subject | Final status | Evidence |
|---|---|---|---|
| UR-1 | v0.7.0 template wave deleted `scripts/review-baseline.ts`; upgrade flow ignores LOCAL-PATCH | Superseded/closed — the script was restored (PRs #190/#191/#192), then retired at the 0.18.0 wave (commit 78adacd, 2026-10-13) when its checks were delivered from the template (audit.ts, `check-project-meta.ts`, CI docs-link). The upgrade-side half is addressed by the LOCAL-PATCH pre-scan + MARKER_LOSS guard (see §2 of the historical index). Residual nit: `scripts/SCRIPTS.md:426-430` still documents the retired script — candidate for the next docs pass | `git log -- scripts/review-baseline.ts`; `git ls-files` → absent at HEAD; L0 `scripts/upgrade-project.ts:3433` |
| UR-2 | `skills/project-review/SKILL.md` names the legacy `.claude/template-version.txt` marker | Superseded upstream; marker still live (6 mirrors) — upstream skill sources no longer mention `template-version.txt` at all, so the patch text is stale-but-harmless until the next delivery reconciles it | marker at `skills/project-review/SKILL.md:57`; grep over `/Users/techcross/git/ai_workspace/skills/project-review/SKILL.md` + `templates/common` + `templates/co-abap` copies → no hits |
| UR-3 | CLAUDE.md §5/§6 and GEMINI.md §5 headings inside COMMON blocks | Fixed locally (PR #192, 2026-10-10); current instruction files carry no §-headings (verified). Upstream adoption **unverified — needs upstream_request_status check** (no store ticket on record; the related-but-different COMMON-AGENTS qualification was fixed upstream as U-20261028-008, PR #1700) | grep `^## §` CLAUDE.md GEMINI.md → no hits; CHANGELOG 2026-10-10 entry (#192) |
| UR-4 | dev-sync REST fallback for `gh pr` in cloud sessions | Resolved — promoted upstream: L0 dev-sync v1.28.0 (2026-10-13, T-20261013-006 batch) carries the REST fallback, and the delivered project copy carries it too | `scripts/dev-sync.ts:186-188`; L0 `scripts/dev-sync.ts:261-272` |
| UR-5 | ADR-0099 not delivered to projects | Open — still not delivered: no delivered doc references ADR-0099 (grep 2026-11-13 → hits only in review reports/designs). No upstream ticket on record (CHANGELOG fallback filing only) — **needs an upstream filing or deliberate closure** | grep "0099" over docs/ + instruction files |
| UR-6 | audit.ts skips the docs-link gate in L3 without a SKIP line | Mitigated locally via CI — `.github/workflows/ci.yml:50` runs `validate-docs-links.ts --all` (PR #192); the audit gate itself remains workspace-root-gated (`scripts/audit.ts:2543`). The audit-SKIP-line ask is **unverified upstream** — no ticket on record | ci.yml; audit.ts gate condition |

### 3.2 U-20261028-004…-015 wave (2026-10-28 review)

All twelve co-abap tickets are `done` and archived in the governance store
(7-day dwell elapsed). Outcomes per store record: `fixed` upstream in the
2026-10-29 mechanical batch (PR #1700; -014 in PR #1729) or adjudicated
`local-only` (fix belongs in this project, executed via the PR #229-era
re-land, 2026-10-29).

| Ticket | Outcome | Subject (abridged) |
|---|---|---|
| U-20261028-004 | done / local-only | Hook waves overwrite LOCAL-PATCH'd hooks (SECRET_ERE loss) → move patterns to `.gitleaks.toml` [[rules]]; extension-point note queued upstream |
| U-20261028-005 | done / local-only | Upgrade waves lack CHANGELOG entries → retrospective backfill duty (the two live CHANGELOG markers) |
| U-20261028-006 | done / fixed | Delivery bookkeeping engine (2026-10-29-delivery-bookkeeping-engine-design, DEC-20261029-01) |
| U-20261028-007 | done / fixed | PM-gateway-workflow.md retired from L1 delivery |
| U-20261028-008 | done / fixed (PR #1700) | COMMON-AGENTS delivery sentence qualified as workspace-root contract (B-A14 transform) |
| U-20261028-009 | done / fixed (PR #1700) | regenerate-agents-md v1.4.0 — VARIANT-PHASE-GATE header rows, "Phase —" placeholder |
| U-20261028-010 | done / fixed (PR #1700) | context.md Standard Root Files gains CODEX.md + HERMES.md |
| U-20261028-011 | done / fixed (PR #1700) | skill-lifecycle-audit v1.9.0 — LC/MV check un-gated for delivered projects |
| U-20261028-012 | done / local-only | `scripts/co-abap/SCRIPTS.md` sub-registry corrections |
| U-20261028-013 | done / local-only | CHANGELOG duplicate-category merge (project-owned file) |
| U-20261028-014 | done / fixed (PR #1729) | Owner-decision batch (2026-10-29-owner-decision-batch-design) |
| U-20261028-015 | done / fixed (PR #1700) | install-vsp v1.2.0 — credential guidance via .env/keychain; re-delivery clears the project LOCAL-PATCH |

Note: U-20261028-016…-019 (same date range) belong to project co-safety, not
co-abap. Earlier reviews citing "U-20261028-004…-019" as one co-abap range
were imprecise; the co-abap wave is -004…-015.

### 3.3 U-20261112-010…-019 wave (2026-11-12 review) — store-verified 2026-11-13

Store truth (upstream_request_status + governance store, 2026-11-13): the
co-abap wave was filed 2026-11-12 as ten findings named -010…-019, but
-010/-011 left the live store overnight — those ids are held by same-day
co-develop requests (created 04:16, before the co-abap filing at 10:01).
The two affected fixes were re-filed 2026-11-13 as **U-20261113-002** (trail)
and **U-20261113-003** (skill lifecycle records); all live LOCAL-PATCH
markers migrated to the new ids (see §2). Current statuses:
U-20261112-012 is done/fixed upstream (encoding-utils 1.3.0, PR #1991 —
rides the next delivery); U-20261112-013…-019 are in review;
U-20261113-002 is waiting/ready; U-20261113-003 is backlog/inbox
(path_not_template_managed flag).

| Ticket | Status (2026-11-13) | Resolution / subject |
|---|---|---|
| U-20261112-012 | done / fixed | encoding-utils 1.3.0 — detectEncoding zero-line-ending branch returns lf instead of mixed; **upstream PR #1991** |
| U-20261112-013 | review | hook-target existence gate |
| U-20261112-014 | review | CI-reference existence check, validator hardening |
| U-20261112-015 | review | mcp-proxy-routing parity coverage: opencode.json + settings.json mcpServers |
| U-20261112-016 | review | co-abap.context.md content-rot family (anchor repoint + DA-1..DA-8 restoration) |
| U-20261112-017 | review | L0-design reference qualification convention |
| U-20261112-018 | review | Codex hooks stub doctrine |
| U-20261112-019 | review | CHANGELOG same-entry-duplicate lint blind spot |
| (U-20261112-010) | vanished → re-filed as **U-20261113-002** (2026-11-13) | Trail fleet-standard delivery gap + delivered-side detector — marker live on 6 instruction-doc blocks; U-20261113-002 (re-file of the vanished U-20261112-010) — waiting/ready |
| (U-20261112-011) | vanished → re-filed as **U-20261113-003** (2026-11-13) | Skill lifecycle-records delivery gap + MV-invisible delivered records — marker live on 35 lifecycle records; U-20261113-003 (re-file of the vanished U-20261112-011) — backlog/inbox (path_not_template_managed flag) |

## 4. Reconciliation duty

After **every** `upgrade-project` delivery (and at project-review time):

1. Re-run the live-marker scan (the helper is a pure library — invoke it via
   Bun):
   ```bash
   bun -e "import { scanLocalPatches } from './scripts/helpers/local-patch-scan.ts'; \
     const f = scanLocalPatches('.'); console.log(f.length); \
     for (const x of f) console.log(x.id + '  ' + x.file);"
   ```
2. Diff the output against the §2 table above; add, re-status, or prune rows.
3. Refresh ticket statuses from the upstream channel
   (`upstream_request_status`, or the governance store at
   workspace-root `tickets/governance/` for archived waves).
4. A delivery that lowers a file's marker count is guarded upstream
   (MARKER_LOSS skip + `--disposition adopt-template` grant flow) — never
   delete a marker row here without confirming the template now carries the
   patch hunk.
5. Record the reconciliation pass (date + delta) in the session memory log.

*Consolidated from: the pre-2026-11-13 §-series of this file (2026-08-23/24 and
2026-09-26 review cycles), the 2026-10-10 UR-series
(`docs/reports/2026-10-10-project-review-full.md:124`, CHANGELOG #190/#191/#192),
the 2026-10-28 ticket wave (governance store, archived), and the 2026-11-12
ticket wave (`upstream_request_status`, 2026-11-13). Design:
`docs/designs/2026-11-13-upstream-ledger-consolidation-design.md`.*

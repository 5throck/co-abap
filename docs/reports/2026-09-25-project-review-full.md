# Project Review — co-abap — 2026-09-25

**Date**: 2026-09-25
**Scope**: variant project (co-abap), branch `pr/20260925-192014-chore-upgrade-template-sync-2026-09-25-d`
**Method**: 4 parallel review agents (Architecture+Scaffolding / Standards+Lifecycle / Automation / Documentation+Security) + machine battery
> Analysis only — no files modified in this report (report + memory log only).

## Baseline (machine battery)

| Validator | Result | Notes |
|---|---|---|
| `bun scripts/audit.ts` | ✅ PASS (1 WARN) | WARN: "AGENTS.md §6: Skills section not found — skill-table integrity check skipped". Root cause identified in review: the §6 regex (`audit.ts:3001`) is an L0-shaped check that can never pass on a variant; variant-side guarantee is provided by the VERSION_MANIFEST Skills registry check (audit.ts:1937). |
| `bun scripts/validate-templates.ts` | ❌ ERROR | `templates/` not found (validate-templates.ts:326-331). Inapplicable check on variant checkouts — no layer/context gate. Finding #11. |
| `bun scripts/verify-scripts.ts --verify` | ✅ PASS | 135 applicable registry rows verified (148 rows − 13 L0-only). The "135 vs ~65 files" delta is by design: registry counts all SCRIPT_EXTENSIONS recursively; `scripts/co-abap/` has its own sub-registry. |
| `bun scripts/agent-lifecycle-audit.ts` | ⚠️ 22 WARN | 20 stale `last_updated` + 2 registry-format (read-only-analyst, schema-inspector). Findings #1, #6, #14. |
| `bun scripts/skill-lifecycle-audit.ts` | ✅ PASS | 47 skills healthy — but has no stale-`last_reviewed` check (finding #15). |
| drift check (`propagate-to-templates.ts`) | N/A | L0-only script, not delivered to variant (expected per tier model). |
| `bun test scripts` | ✅ 26/26 | ~155 ms. |
| `bun run typecheck` | ❌ 4 errors | No gate catches it in this variant (baseline file absent → typecheck.ts skips; dev-sync gates on CONSTITUTION.md). Finding #13. |

Baseline ERRORs < 3 → no T-03 escalation; full scope executed. base-map MCP: not available (skipped).

## Review Results — co-abap — 2026-09-25

Slots: **A** = Architecture+Scaffolding, **B** = Standards+Lifecycle, **C** = Automation, **D** = Documentation+Security. Duplicates merged with cross-credit.

### 🔴 Critical (fix immediately)

| # | Issue | Agent | File:Line | Class | Fix |
|---|-------|-------|-----------|-------|-----|
| 1 | Duplicate `lifecycle:` YAML key in 20/21 agent frontmatters silently discards newer metadata (YAML last-key-wins). Introduced by commit `0edcc46` (2026-09-20, "upgrade template tooling 1.35.0"), which appended a second `lifecycle:` block + `version:` instead of updating in place, and backdated `last_updated` to 2026-08-21/08-25. Root cause of most of the 22 baseline stale warnings. | A+B | `agents/*.md:13-35` (e.g. `agents/code-writer.md:18-34`) | script-gap | Dedupe blocks keeping newer `last_updated` + `governance` key; fix L0 upgrade merge step; add duplicate-key rejection to `validate-agents.ts` (strict YAML parse). |
| 2 | `skills/SKILLS.md` auto-generated index corrupted: all 35 links embed Windows absolute paths from another machine (`C:\git\...`), 8 phantom skills referenced (k-dart, k-law, mece-logic-auditor, presenter-mode, sarif-exporter, stride-threat-matrix, swe-solve, validate-docs-links), 20 real skills missing, generated 2026-08-23. Corruption is committed, not local. | A+B | `skills/SKILLS.md:7+` | script-gap | Regenerate with `bun scripts/verify-skills.ts` on this machine; add generator guards rejecting non-relative link paths and skills absent from disk; add regeneration to dev-sync. |
| 3 | `memory/MEMORY.md` index broken: 14 links to files missing from disk AND archive (2026-05-22…08-15 + 3 meeting notes — May–Aug history apparently lost), `memory/2026-09-19.md` exists but is not indexed, hand-written table vs auto-generated block disagree. | B | `memory/MEMORY.md` | script-gap | Rebuild via `update-memory-index.ts`; recover May–Jul files from git history or drop rows with a note; make auto-block the single source of truth. |
| 4 | `AGENTS.md` is a pre-marker-expansion template generation: only §-heading is `### §3.6`; §1/§5/§6/§8 skeleton and 5 VARIANT-\* marker families (AGENT-DETAILS, DISPATCH-TRIGGERS, PHASE-GATE, SUBAGENT-ROSTER, ROLE-BOUNDARY) absent — while `audit.ts:2225-2245` expects them. Direct root cause of the permanent baseline WARN. HEAD (1bfd66d) resynced CLAUDE/GEMINI/CODEX/context.md but not AGENTS.md. | A | `AGENTS.md` (whole-file generation drift) | systemic | Regenerate at L0 (`regenerate-agents-md.ts --variant co-abap`) and re-seat the ABAP registry content into the current marker skeleton. |

### 🟡 High (fix within 1 week)

| # | Issue | Agent | File:Line | Class | Fix |
|---|-------|-------|-----------|-------|-----|
| 5 | `skills/post-write-chain/SKILL.md` frontmatter is invalid YAML — unquoted `: ` inside description scalar. All tooling fails to read good data (version 1.1.0, owner pm); poisons VERSION_MANIFEST (`[ERROR]` in its Drift section, row shows N/A). | B | `skills/post-write-chain/SKILL.md:2` | script-gap | Quote the description (1-line). Add strict-YAML parse to `validate-skills.ts`. |
| 6 | `agents/pm.md` escapes the lifecycle audit entirely (`findAgentFiles()` at agent-lifecycle-audit.ts:203 requires `role:`/`color:`, pm has neither): stale `last_updated` invisible despite today's ~300-line change; no `status:` field; dangling `extends: ../../common/agents/pm.md` (`common/` does not exist). Also frontmatter schema fragmentation across roster (pm.md and i18n-specialist.md deviate from the 19-file standard shape). | A+B | `agents/pm.md` frontmatter; `scripts/agent-lifecycle-audit.ts:203-205` | script-gap | Add `status:`/`role:` to pm.md; repoint or delete dead `extends`; extend `findAgentFiles()` to scan all frontmatter-bearing files. |
| 7 | 22 broken relative links invisible to the default gate: 20 files in `docs/lifecycle/agents/*.md:7` link `../../agents/<name>.md` (resolves to nonexistent `docs/agents/`; correct is `../../../agents/`), plus 2 bad links in `docs/superpowers/plans/2026-05-24-project-improvement.md`. `validate-docs-links.ts` scans docs/ root only by default; `--all` finds them but is not wired into any gate. | D | `docs/lifecycle/agents/*.md:7` | script-gap | Rewrite the 20 links; wire `--all` (or a scoped lifecycle check) into the audit chain. |
| 8 | `auto-merge.yml` can squash-merge a PR with **zero** CI checks: gate aborts only on `failed>0` or `pending>0`; `total==0` falls through and merges after 2 approvals. | D | `.github/workflows/auto-merge.yml:57-72` | one-time | Add `total === 0` → `core.setFailed('no CI checks present')`. |
| 9 | `actions/github-script@v7` tag-pinned (mutable, supply-chain pivot) in a workflow holding `contents: write` + `pull-requests: write` — inconsistent with ci.yml's SHA-pinning convention. | C+D | `.github/workflows/auto-merge.yml:21,53,75` | script-gap | Pin to commit SHA with version comment; add an action-pin lint to CI. |
| 10 | Graft rebake set (uncommitted 4-file diff) must not be committed as-is: `BAKED` in `graft-hooks.cjs:7` / `graft-statusline.cjs:7` was rebaked from a committed Windows path to `/Users/techcross/...` — the fallback chain (`entry()`, lines 56-65) cannot see bun-global installs, guaranteeing per-machine churn and silent hook no-ops elsewhere (`catch(() => {})` at line 67); `opencode.json:5-8` now requires global `graft` on PATH. Leaks username; breaks other machines silently. Hooks also execute a globally-installed package (standing supply-chain trust, outside lockfile). | C+D | `.claude/helpers/graft-hooks.cjs:7,67`, `graft-statusline.cjs:7`, `opencode.json:5-8` | systemic | Upstream portable resolution into graft (env var e.g. `GRAFT_DIST_DIR`, or add `~/.bun/install/global/node_modules` to the probe); keep this diff local; document the trust assumption in SECURITY.md. |
| 11 | `validate-templates.ts` hard-fails (`exit 1`) on any variant checkout — no layer/context gate, unlike sibling validators (verify-scripts detects "Context: L3"; layer-filter.ts exists; pre-commit.ts:183 already gates it correctly). Contradictory allow entry in `.claude/settings.json:175`. | C | `scripts/validate-templates.ts:326-331`; `.claude/settings.json:175` | script-gap | Mirror verify-scripts' context handling: print `[SKIP]` and exit 0 on detached L3; keep hard error at L0. Resolve the settings allow entry. |
| 12 | `package.json:13` `scratch-cleanup` points to nonexistent `scripts/scratch-cleanup.ts` (real: `scripts/co-abap/scratch-cleanup.ts`) — `bun run scratch-cleanup` exits 1. No validator checks package.json ↔ disk sync. | C | `package.json:13` | script-gap | Fix the path; teach `verify-scripts --check-drift` to validate package.json script targets. |
| 13 | `bun run typecheck` fails with 4 errors, invisible to every gate in this variant: TS2584 `document` in `render-pdf-deck.ts:239-240` (tsconfig lib lacks `DOM`); TS2307 literal specifiers to L0-only `scripts/validators/` in `validate-agents.ts:23` / `validate-skills.ts:19` (audit.ts:803 already demonstrates the non-literal `new URL(...)` fix pattern). Gates skip: typecheck-baseline.json absent, dev-sync requires CONSTITUTION.md. | C | `scripts/render-pdf-deck.ts:239`, `scripts/validate-agents.ts:23`, `scripts/validate-skills.ts:19`, `scripts/tsconfig.json:5` | script-gap | Apply the audit.ts:803 pattern; add `DOM` lib (or cast via globalThis); decide the variant's typecheck SSOT (package.json script vs dormant gate). |
| 14 | 20 agents carry stale/misleading `last_updated`: 16 files at 2026-08-21, 3 at 08-25, 1 at 09-15 — while commit `0edcc46` (09-20) actually changed behavior (added "PM-ONLY INVOCATION" section, changed output template to `deliverables/templates/01_srs.md`). The sync backdated stamps to template-era dates. | B | `agents/*.md` frontmatter | script-gap | One pass bumping to true change dates (superset of #1's dedupe); fix upgrade tooling to stamp commit dates. |
| 15 | Skill `last_reviewed` staleness is unmonitored: ~35 of 47 SKILL.md files older than their last git commit (e.g. script-lifecycle-manager 2026-05-30 vs 09-21); `skill-lifecycle-audit.ts` has no equivalent of the agent stale-date check. | B | `skills/*/SKILL.md`; `scripts/skill-lifecycle-audit.ts` | script-gap | Port the stale-date check into skill-lifecycle-audit; one review pass over drifted skills. |
| 16 | Dangling §-anchors across sibling docs pointing at sections AGENTS.md doesn't have (§5.1/§5.1.1/§8): CLAUDE.md:124, GEMINI.md:152, CODEX.md:126, docs/context.md:306+493-499, AGENTS.md:587 (self-citation), AGENTS.md:33 (§0-A undefined). | A+B | see left | systemic | Point to the workspace-root AGENTS.md with explicit qualifier (pattern already used at AGENTS.md:595), or add a one-line pointer section. Superset of #4's regeneration. |
| 17 | `docs/co-abap.context.md` rot: Technical table (lines 66-93) omits i18n-specialist (20/21); DYNAMIC_SKILLS block (101-120) lists 13/47 skills despite "auto-discovered" claim; phantom "Deployed vsp Binary" table (195-202, no vsp binary exists); SSOT edit instructions (416-425) point at nonexistent `templates/common/docs/context.md` while `docs/context.md` says it is pipeline-managed — conflicting guidance that would mislead any agent. | A | `docs/co-abap.context.md:66-93,101-120,195-202,416-425` | systemic | Add i18n row; regenerate/extend skills block or re-scope claim; delete phantom table; rewrite sync guidance in L2 terms. |
| 18 | `.claude/skills/graft/` is git-tracked but exists only in the Claude platform dir, violating docs/context.md:83 ("platform dirs MUST NOT be the sole location"). Mitigating: deliberately registered in docs/VERSION_MANIFEST.md:66. | A | `.claude/skills/graft/SKILL.md` | one-time | Promote to `skills/graft/` + sync, or document a formal SSOT exception in manifest + context.md. |
| 19 | Encoding corruption (mojibake) in command prompts: `.claude/commands/triage.md:11,53,68,88,130,136,138` (`짠0`, `?뱥` — double-encoded phase markers/emoji), `celebrate.md:19`. Outside validate-md-language's 88-file scope. | D | `.claude/commands/triage.md`, `celebrate.md` | script-gap | Restore intended glyphs (or ASCII markers); add UTF-8 sanity lint for `.claude/commands/`. |

### 🟢 Moderate (fix within 2 weeks)

| # | Issue | Agent | File:Line | Class | Fix |
|---|-------|-------|-----------|-------|-----|
| 20 | Translation mirrors not hash-tracked: `README_ko.md`, `docs/user-guide_ko.md`, `docs/handoff-spec_ko.md` lack `translated_from_hash` frontmatter; user-guide pair stage finds no pairs (script scope/naming mismatch); README_ko can drift silently. | D | `README_ko.md`, `docs/*_ko.md` | script-gap | Add frontmatter; fix verify-readme-sync pair detection. |
| 21 | `validate-doc-folder.ts` exits 1 expecting `docs/constitution/`+`docs/governance/`; variant keeps root `governance/`+`decisions/`. audit.ts:260,296 guards stay green — validator/layout mismatch, unwired. | D | `scripts/validate-doc-folder.ts` | script-gap | Accept variant layout or document as advisory. |
| 22 | Hangul example words inside AGENTS.md:562-566 / CLAUDE.md:117-118 conflict with the policy's own strict reading (exception "NOT available for AGENTS.md/CLAUDE.md"). | D | `AGENTS.md:562-566`, `CLAUDE.md:117-118` | one-time | Add explicit carve-out sentence ("Korean glyphs permitted as linguistic examples in this section"). |
| 23 | Third-party HTTP MCP endpoints auto-enabled (`enableAllProjectMcpServers: true` + 2 marianzeis.de servers) and broad `Bash(curl -sI *)` allow to any host. Acceptable if intentional; undocumented. | D | `.mcp.json:18-25`, `.claude/settings.json:167,174` | one-time | Confirm + document in docs/mcp_usage.md; scope the curl rule. |
| 24 | `scripts/SCRIPTS.md` exact duplicate rows (`gen-pr-body.ts` at :83/:86, `generate-ide-rules.ts` at :84/:87 — 135 rows, 133 unique) and dead relative ADR links (:14 ADR-0036, :18 ADR-0054 — workspace-root ADRs). | B | `scripts/SCRIPTS.md:14,18,83-87` | script-gap (dupes) | Delete dup rows; annotate ADR links as workspace-root; add duplicate-name warning to verify-scripts. |
| 25 | ADR-0079 cited as unqualified local path (`docs/adr/0079-...`) that dangles — every sibling citation correctly says "workspace root". | A | `AGENTS.md:595` | one-time | Add "workspace root" qualifier. |
| 26 | `bun-version: latest` in ci.yml — non-reproducible CI. | C | `.github/workflows/ci.yml:26` | one-time | Pin a concrete version. |
| 27 | `scripts/typecheck.ts:21` claims CI wiring in `test.yml` — workflow does not exist (only ci.yml, auto-merge.yml). | C | `scripts/typecheck.ts:21` | one-time | Fix header or restore workflow. |
| 28 | `scripts/tsconfig.json` `include: ["*.ts"]` — `scripts/tests/`, `scripts/co-abap/`, `scripts/handbook/` never typechecked. | C | `scripts/tsconfig.json` | one-time | Widen include (with excludes) or document scope. |
| 29 | VARIANT-INJECT marker convention drift in co-abap.context.md: unclosed-style pair (:31/:59) vs `[REQUIRED]`+END style (:469/:488) — third style vs canonical X:START/X:END; first pair machine-unchecked. | A | `docs/co-abap.context.md:31,59,469,488` | systemic | Normalize to named START/END form. |
| 30 | Graft managed-block asymmetry: AGENTS.md has WORKSPACE-MANAGED graft block, CODEX.md bare graft:start/end, CLAUDE.md/GEMINI.md none. | A | `CODEX.md:175-215`; absent in CLAUDE/GEMINI | systemic | Verify injector targets; align all four tool files. |
| 31 | `docs/lifecycle/skills/` holds 3 records vs 47 skills (agents are 21/21) — coverage criterion undocumented. | A | `docs/lifecycle/skills/` | systemic | Document the criterion (governed skills only?) or close the gap. |
| 32 | `asyncRewake` field in settings.json (:37, :111) unverifiable as a documented hook field — if a typo, rewaking silently no-ops. Pre-existing at HEAD. | C | `.claude/settings.json:37,111` | one-time | Verify against current hook docs. |

### ℹ️ Low / Improvements

| # | Issue | Agent | File:Line | Class | Fix |
|---|-------|-------|-----------|-------|-----|
| 33 | gitleaks OCI image pinned by mutable tag `v8.28.0`, not digest. | C | `ci.yml:49-51` | one-time | Digest-pin. |
| 34 | `.githooks/pre-rebase` uses bash-only `&>` — breaks under `sh`. | C | `.githooks/pre-rebase` | one-time | Use `>... 2>&1`. |
| 35 | Duplicate agent numbering in AGENTS.md (PM = "1" in Business; Architect = "1" in Technical) — ambiguous dispatch references. | A | `AGENTS.md:29,101` | one-time | Continuous numbering. |
| 36 | Stale variant version comment `upgraded: 2026-08-15` (AGENTS.md:23; file changed 09-22) and `Last Updated` footer sits mid-file (line 401). | A | `AGENTS.md:23,401` | one-time | Update on next regeneration (#4). |
| 37 | SKILL.md frontmatter field drift: some carry `last_reviewed`+`last_updated`, others only one. | A | e.g. `skills/translate/SKILL.md` | systemic | Standardize field set in next skill pass (#15). |
| 38 | Registered design doc lacks mandated `<spec-id>-design.md` suffix; entry 1 registers an ADR as a spec (acceptable as add-if-missing seed). | B | `docs/specs/registry.json` | one-time | Normalize on next registered spec. |

### ✅ Strengths

- **Secrets: clean.** gitleaks over full history (327 commits, 30.69 MB) — no leaks; only placeholder credentials tracked (`.env.sample`, VSP_SETUP_GUIDE); deny-list blocks `git push --force*`/`--no-verify`/`rm -rf`.
- **ci.yml is exemplary**: workflow-level `contents: read`, no `pull_request_target` anywhere, all actions SHA-pinned with version comments, hashFiles install guard, gitleaks as pinned OCI image with `--redact` (license-avoiding rationale documented).
- **Hook scripts safe**: `execFileSync`/`Bun.spawnSync` array form only, no shell interpolation, no unexpected network, fail-safe no-op on import error.
- **Skills SSOT distribution perfect**: `skills/` == `.agents/skills/` == `.gemini/skills/` (47/47 identical).
- **VERSION_MANIFEST counts reconcile with disk**: 21 agents, 102 scripts, 48 skills (47 + platform graft); per-skill versions/owners/triggers.
- **Registry coverage complete**: all 21 agent files indexed in AGENTS.md; `docs/lifecycle/agents/` 21/21; no orphaned or undeclared agents; all 64 top-level scripts registered.
- **Marker integrity clean**: every START has its END across AGENTS/CLAUDE/GEMINI/CODEX (content drift exists; no orphans).
- **Tests green**: `bun test scripts` 26/26; dispatch*.ts + retry-handler.ts tsc-clean, no OS-specific hazards.
- **Command parity properly declared**: 11 Claude-only commands all carry `gemini-parity: skip` per the exception contract.
- **Design Gate holds**: docs/specs/registry.json valid and complete; the one design doc in docs/designs/ is registered.
- **Recent memory logs convention-compliant** (2026-09-19 → 09-25, four mandated sections).
- **Self-auditing automation**: audit.ts covers language policy, shell-injection patterns, `> nul` redirects, workflow permission hygiene, marker drift, model-registry consistency — and passed.

## Domain Summary

| Domain | Critical | High | Moderate | Low | Notable strength |
|---|---|---|---|---|---|
| A: Architecture+Scaffolding | 3 (#1,#2,#4) | 4 (#6,#16,#17,#18) | 4 | 3 | Marker integrity; tier contracts correct (variant.json absence is by design) |
| B: Standards+Lifecycle | 3 (#1,#2,#3) | 4 (#5,#6,#14,#15) | 1 | 1 | VERSION_MANIFEST reconciles; registry 100% coverage |
| C: Automation | 0 | 4 (#9,#10,#11,#12,#13*) | 4 | 2 | ci.yml exemplary; tests 26/26 |
| D: Documentation+Security | 0 | 3 (#7,#8,#19) | 3 | 0 | Secrets clean; language enforcement works |

\* #13 shared C-primary.

**Theme**: the 2026-09-20 "upgrade template tooling 1.35.0" sync introduced the frontmatter corruption (#1/#14) and HEAD's 09-25 sync skipped AGENTS.md (#4) — i.e., the template-sync pipeline itself is the largest single source of drift. Secondary theme: validators that are L0-shaped running silently on variants (#11, #21, §6 WARN) and gates that skip variants (#13, #15, #7) — the machine baseline looks green while real defects accumulate.

## Action wiring (Step 5)

`scripts/ticket.ts` is L0-only; this variant records deferred items here + in `memory/2026-09-25.md` (per skill Step 5). No fixes applied in-session (analysis-only review on an in-flight template-sync PR branch whose 4 uncommitted files should stay local — #10).

**validator-hardening backlog** (ratchet loop — every `script-gap` finding above, consolidated):
1. `validate-agents.ts`: reject duplicate YAML keys; scan all frontmatter-bearing agents incl. `extends:` (#1, #6)
2. `verify-skills.ts`: strict YAML parse; reject absolute/phantom paths in SKILLS.md; regenerate in dev-sync (#2, #5)
3. `skill-lifecycle-audit.ts`: port stale-`last_reviewed` check (#15)
4. `agent-lifecycle-audit.ts`/upgrade tooling: stamp commit dates, never template dates (#14)
5. `validate-docs-links.ts`: wire `--all`/subdirectory scope into audit chain (#7)
6. `validate-templates.ts`: L3 skip path (#11); `validate-doc-folder.ts` variant layout (#21)
7. `verify-scripts --check-drift`: also validate package.json script targets + duplicate registry rows (#12, #24)
8. Typecheck gate that runs on variants (#13); UTF-8 lint for `.claude/commands/` (#19)
9. CI action-pin lint (#9); memory index freshness gate (#3)
10. `audit.ts` §6 check: skip/downgrade to INFO on non-workspace-root (kills the permanent WARN honestly)

**Fix-now queue for next session** (quick, in-repo, unambiguous): #5 (1-line YAML quote) → #12 → #24/#25 → #8 → #9 → #7 → #3 → #2 regenerate → #19 → #22/#23/#26/#27.

**L0/tooling cycle**: #1 merge-step fix + #4 AGENTS.md regeneration (must run at workspace root) → #10 graft upstream → remaining systemic items (#16, #17, #29, #30, #31) at next template sync.

## Verification (Step 6 — fixes applied same session)

Applied the fix-now queue (#5, #12, #24, #25, #8, #9, #7, #3, #2, #19, #22, #26, #27) plus follow-on regenerations. Files touched: `skills/post-write-chain/SKILL.md` (+4 platform mirrors), `package.json`, `AGENTS.md`, `CLAUDE.md`, `scripts/SCRIPTS.md`, `docs/lifecycle/agents/*.md` (20), `docs/superpowers/plans/2026-05-24-project-improvement.md`, `.github/workflows/auto-merge.yml`, `.github/workflows/ci.yml`, `scripts/typecheck.ts`, `.claude/commands/triage.md`, `.codex/prompts/triage.md`, `.claude/commands/celebrate.md`, `memory/MEMORY.md`, `skills/SKILLS.md` (regenerated), `docs/VERSION_MANIFEST.md` (regenerated). The 4 pre-existing graft-rebake files (#10) were deliberately left untouched and uncommitted.

| Check | Result |
|---|---|
| `bun scripts/audit.ts` | ✅ PASS — VERSION_MANIFEST gate green after regeneration; only the known §6 WARN remains (L0-shaped check, finding #4) |
| `bun scripts/verify-scripts.ts --verify` | ✅ 133 rows (135 − 2 duplicate rows removed) |
| `bun scripts/validate-docs-links.ts` (default) | ✅ clean |
| `bun scripts/validate-docs-links.ts --all` | 1 remaining: `${entry.file}` in `docs/superpowers/plans/2026-05-24-project-improvement.md:1672` — inside a code fence (script sample), a validator false positive; intentionally left |
| `bun test scripts` | ✅ 26/26 |
| `bun scripts/verify-memory.ts` | ✅ 6 session files, 0 warnings — index↔disk in sync |
| `bun run scratch-cleanup` | ✅ works (package.json path fixed) |
| Workflow YAML parse (js-yaml) | ✅ both edited workflows parse |
| Mojibake grep (`짠`, `?뱥`, `?럦`, `??`) | ✅ 0 matches in triage×2 / celebrate |
| `bun scripts/verify-skills.ts` | 47 checked; 1 pre-existing WARN not in review scope: `finishing-a-development-branch` missing `metadata` section (new Low observation #39) |
| VERSION_MANIFEST regen | post-write-chain row now populated (1.1.0 / pm); parse-error snippet cleared; generator still reports the known documented drift items (pm missing tier → #6, performance-tuning no triggers → #15 family, 4 commands without skills) |

**Still deferred** (per wiring above): #1 lifecycle dedupe + date stamps, #4 AGENTS.md regeneration, #6 pm.md schema, #13 typecheck fixes, #14 tooling date-stamping, #15 skill staleness check, #16–#18, #20–#21, #28–#38 — L0/tooling cycle + next sessions. Commit step intentionally not run (in-flight PR branch; run `/sync` after deciding the graft-4 files' fate, with a Design Gate spec entry or `--spec-exempt` for this batch).

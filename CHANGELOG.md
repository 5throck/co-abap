# Changelog

All notable changes to **abap-harness-engineering** (main project harness) are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versions follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased]
- **[2026-09-25]**: fix(review): full project-review remediation — 4 Critical + 13 quick-fix findings across the repo. **Agents**: duplicate `lifecycle:` frontmatter blocks removed from 20 agent files with `last_updated` stamped to the true change date — agent-lifecycle-audit warnings 22 → 0; root cause fixed upstream in L0 `preserveLifecycleFrontmatter` (replace-in-place instead of append; inline-tested). **AGENTS.md**: regenerated onto the current §-numbered skeleton (all 5 VARIANT marker families + §6 Skills restored — permanent audit §6 WARN cleared), ABAP registry content re-seated under §2/§4 (analyst activation, dispatch sequences, 6-step lifecycle, deliverables workflow, cross-module orchestration, error recovery, dispatch automation), §6 L0-only skill rows swapped for local ones, `templates/co-abap/AGENTS.md` synced, L1 common template gained the ADR-0079 workspace-root qualifier + Hangul carve-out. **Skills/memory**: `skills/SKILLS.md` regenerated (Windows-path links + 8 phantom skills gone), post-write-chain SKILL.md YAML quoting (+4 platform mirrors), `memory/MEMORY.md` rebuilt (14 dead links dropped with provenance note, 2026-09-19 indexed). **Docs**: 20 broken `docs/lifecycle/agents` links + superpowers plan link fixed; triage/celebrate command mojibake repaired (claude+codex copies); SCRIPTS.md duplicate rows removed + workspace-root ADR link annotations; ADR-0079 qualifier in-manifest. **Automation**: auto-merge.yml zero-CI-check merge window closed + `github-script` SHA-pinned (3 sites), ci.yml bun pinned 1.4.2, package.json scratch-cleanup path fixed, typecheck.ts stale CI reference corrected, graft helpers made portable (`GRAFT_DIST_DIR` override + bun-global probe — machine-specific baked path removed, unblocking the 4-file settings rebake). Gates: audit PASS incl. §6, verify-scripts 133 OK, docs-links clean (1 documented code-fence false positive), tests 26/26, memory index in sync. Design: `docs/designs/2026-09-25-project-review-remediation-design.md`; full findings: `docs/reports/2026-09-25-project-review-full.md`.
'- **[2026-09-21]**: chore(upgrade): fleet resync via upgrade-project 1.39.0 (workspace scaffold-hardening wave, upstream #1007) — delivers skill-lifecycle-audit 1.5.1 (project-variant-aware scope validation; orphaned-owner warning gated to the authoring surface), handbook-sync-audit 1.0.5 (owner handbook-reviewer → pm), dev-sync 1.16.0 (spec-check auto-E5 for upgrade-delivered diffs), new-project 1.24.0, and the i18n-specialist registration in AGENTS.md §1 — clearing the scope/orphaned-owner/orphan-agent warning noise in every project.'
- **[2026-09-21]**: chore(upgrade): fleet resync via upgrade-project 1.37.1 (workspace lifecycle-modernization wave, upstream #1003/#1004) — delivers the 19-skill patch-bump batch withheld by equal-version drift (translate, documentation-writing, script-lifecycle-manager, skill-lifecycle-manager 1.5.0, agent-lifecycle-manager 1.3.0, handbook-sync-audit 1.0.4, ci-triage, finishing-a-development-branch, source-command-commit-push-pr, research-analysis, api-documentation, platform-command/skill-lifecycle-manager, gateguard, meeting-facilitation, zod-contract-gate, k-* family, as applicable), whole-directory sub-file deliveries healing missing-reference gaps (explain-me references et al), the upstream stale-reference fixes (hwp-document-processing renamed to sample-driven-report-writing, sound-synth, psm-loto, presenter-mode, gmp-deviation-capa, completion-inspection, construction-permit-overview, verify-authorization, source-command-celebrate), and the upgraded lifecycle gates (skill-lifecycle-audit 1.5.0 reference-integrity/removal-date checks; agent-lifecycle-audit 1.3.1 owner/handoff/removal-review checks).
- **[2026-09-21]**: fix(skills): complete the handbook v0.6.0 delivery — the 2026-09-20 fleet upgrade delivered `skills/handbook/SKILL.md` but not the skill's sub-files, so the Korean language support content was absent: added `references/KOREAN_LANGUAGE.md` + `references/MAINTENANCE_PLAYBOOK.md` + `references/I18N_PARITY_PLAYBOOK.md`, refreshed `references/AUTHORING_GUIDELINES.md`, `references/QUALITY_CHECKLIST.md`, and `assets/js/copy-code.js` (localized copy feedback labels incl. ko), all re-delivered to the `.claude`/`.gemini`/`.agents`/`.codex` mirrors. This repo's copy additionally predated several handbook generations — recovered `assets/css/`, `dark-mode-toggle`/`inpage-search`/`lang-switcher`/`site-search.js`, `examples/`, `templates/`, `references/BUILD_GUIDE.md`, `references/SECTION_TYPES.md`, and `references/validation/`. Upstream root cause (upgrade-project syncs only `skills/<name>/SKILL.md`) tracked for a workspace-level fix.
- **[2026-09-20]**: fix(mcp): drop the stray `@nanonets/graft` argument from the graft server entry in `.mcp.json` — `graft mcp` reads that position as a repository dir, so the stdio server failed to resolve this repo's graph and walked up to the workspace root's graph. Matches the clean form in `.agents/mcp.json` and the common template. Fleet follow-up to co-newbiz PR #390.
- **[2026-09-20]**: chore(upgrade): template upgraded to 0.6.0 via `upgrade-project.ts --prune-removed` (2026-09-20 evening resync Step 4) — delivers the common-template LF-enforcement `.gitattributes` block (`*.html/css/js/json/md text eol=lf`), closing the Windows CRLF smudge that failed the pre-push VERSION_MANIFEST gate on 6 of 8 fleet repos; same-version script drift restored to canonical, project-specific gitleaks allowlist entries preserved via merge-aware upgrade `audit.ts` + `verify-scripts.ts --verify` clean post-upgrade.

- **[2026-09-16]**: chore(upgrade): synced template infrastructure via `upgrade-project.ts` (workspace common v0.6.0 content sync, 2026-09-16 fleet resync) — delivered the managed-block merge fix (AGENTS.md graft block and .gitignore secret patterns verified intact), platform skill mirror catch-up (`upgrade-project` 1.5.0 + 4 uniform skills), validator fleet refresh (`audit.ts` 2.39.0 with the VERSION_MANIFEST gate, `validate-templates.ts` 1.33.0, `lifecycle-sync-audit.ts` 1.14.0), full manifest regeneration, and retirement of the inert `sync-agent-status.ts` copy + its ghost SCRIPTS.md rows.


- **[2026-09-15]**: chore(upgrade): synced template infrastructure via `upgrade-project.ts` (workspace common v0.6.0) — refreshed scripts, agent/skill mirrors (`.claude/`, `.gemini/`, `.codex/`, `.agents/`), `docs/context.md`, `AGENTS.md`, `.githooks/`, and `docs/workspace-schema.json` to pick up governance and lifecycle fixes landed upstream since the last upgrade at the same recorded template version.

- **[2026-08-23]**: **[2026-08-24b]**: docs(upstream): restructured `docs/upstream-fix-list.md` after the L0↔L1 comparison analysis — added §6 (**dev-sync `--spec-exempt` CLI flag inert inside the pipeline**; Bun `$` shell passes the interpolated `" --spec-exempt=E3"` as one argv word with leading space, defeating audit's `startsWith` parse; env fallback `SYNC_SPEC_EXEMPT` unaffected — local 1.7.2 fix already applied), §7 (**ADR-0058 country-scoped prune never runs on the upgrade path**; region-neutral co-abap received k-dart/k-law/k-kosis via upgrades — WARN-first burn-in suggested for `upgrade-project.ts`), refined §2 framing (LOCKED-overwrite class resolved upstream in v1.9.0/v1.10.0; remaining vector is SYNC-category script copies → patch-ledger recommendation with hash-based pre-overwrite WARN) and §5 root-cause detail (root masked by `.gitattributes` `*.ts eol=lf`; variants without it check out CRLF).
- **[2026-08-24]**: chore(upgrade)+fix(types): **template infrastructure resync to workspace common latest (picks up `dev-sync.ts` 1.7.1 with the core typing fixes from ai-workspace-standards PR #631) — closing the loop on `docs/upstream-fix-list.md` §1.** Upgrade footprint: all 22 `agents/*.md` refreshed (registry/tool-table alignment), platform mirrors re-synced (`sync-skills.ts`), new KR-scoped `k-kosis` skill distributed to all 3 mirrors, `.claude/commands/sync.md` step tables updated for ADR-0055 Stage 2, `.gitleaks.toml` LOCKED-file refresh verified non-destructive by the new `audit-variant.ts` checks (SAP credential allowlist + scratch/ exclusion both retained). Post-upgrade regressions caught and re-fixed in-session — exactly the hazard documented in `upstream-fix-list.md` §2: (a) `lifecycle-sync-audit.ts` 1.4.7 reintroduced the `ReturnType<typeof readdirSync>` Dirent<Buffer> typing bug our local fix had cleared → re-applied as `Dirent[]` annotations + version bump to **1.4.8**; (b) the new L0-only `audit.ts` variant-validators wiring statically imports `./validators/index.ts`, which is intentionally never propagated to variants — runtime-safe behind its `existsSync` guard but a hard TS2307 under strict tsc in any L1/L2 checkout → suppressed with a documented `@ts-expect-error` and version bump to **2.21.1** (upstream candidate: make the import specifier non-literal or scope variant typecheck). With these applied, `bun run typecheck` is green **without** the temporary `dev-sync.ts` tsconfig exclusion, which is now removed. Gates: typecheck exit 0, tests 88/88, lifecycle-sync PASS, full audit PASS including variant-specific checks.
- **[2026-08-23]**: **[2026-08-23b]**: fix(quality): cleared the full remaining backlog from the 2026-08-23 project review. **Typecheck green**: fixed all 26 non-core type errors (`lifecycle-sync-audit` Dirent typing ×9, `agent-lifecycle-audit` tier/frontmatter casts ×5, `validate-model-registry` definite-assignment ×4, `test-platform-parity` filter narrowing + union mapping ×3, `test-runner` Bun.spawn stream casts ×2, `error-handling.ts fatalError` missing context param passthrough ×2, `skill-lifecycle-audit` frontmatter cast ×1); core `dev-sync.ts`'s 7 upstream-only errors are temporarily excluded via tsconfig (exact patches documented in new `docs/upstream-fix-list.md`). **Variant integrity hook**: added `scripts/audit-variant.ts` v1.0.0 — 7 co-abap-specific checks auto-invoked by audit.ts check #27 (gitleaks project allowlist entries, MCP SAP_ALLOWED_PACKAGES guard, AGENTS.md variant/VARIANT-AGENTS markers, co-abap dispatch wrapper import paths). **Registry/parity**: resolved all 11 command-parity gaps with `gemini-parity: skip` markers; registered non-runtime handoff-spec docs in AGENTS.md scope note; synced Key Tools for architect/dba/devops-admin/schema-inspector with their agent files. **Governance records**: generated validator-compliant `docs/lifecycle/agents/*.md` for all 20 agents (Phase History + Acceptance Criteria sections) and scaffolded `docs/specs/registry.json` + `docs/designs/`. **Script fixes**: hardened `team-builder.ts` `run()` to array-arg spawn (no string splitting); ported SHA256 checksum verification from the co-abap payload copy into root `install-vsp.ts` (v1.1.0) and repaired a pre-existing broken shebang order in both copies that made them unrunnable. **Incident**: detected and recovered encoding corruption of `team-builder.ts`/`verify-skills.ts` introduced by PR #97's version-bump step (ANSI round-trip destroyed multibyte content; restored from parent commit and re-applied changes with safe edit tooling). Gates: typecheck exit 0, audit PASS (incl. variant checks), tests 88/88, links PASS.
- **[2026-08-23]**: fix(governance): full project review (`project-review` skill) remediation — repaired 2 Critical + 5 High findings across registry and tooling. `AGENTS.md` dispatch tree referenced non-existent skills (`memory-intelligence` — removed 2026-05-23 but regressed, plus `bapi-explorer`/`impact-architecture` which are only sections inside `skills/abap-dev/SKILL.md`) — corrected to real skill paths; broken root-level link `../skills/post-write-chain/SKILL.md` → `skills/post-write-chain/SKILL.md`; QA tool contract synced (`GetCodeCoverage`/`SyntaxCheck` now consistent between AGENTS.md roster tables and `agents/test-runner.md`). `agents/pm.md` declared a second P0–P6 "canonical phase schema" contradicting both its own 6-step harness and `docs/phase-definitions.md` (Finalization assigned to both P5 and P6) — unified on the phase-definitions SSOT mapping (PM leads orchestration steps 1/3/6 ↔ agent phases 1/2/5–6); phantom `§1–§5`/`§8` anchor links in pm.md/context.md/phase-definitions.md replaced with real targets. `scripts/verify-skills.ts` was crashing at runtime (`Bun.glob` is not a function — skill auto-discovery fully broken) → rewritten with `new Bun.Glob().scan()` + existence guard for the missing `templates/common/skills` dir. Fixed latent runtime bug in `scripts/team-builder.ts`: `Bun.file().textSync()` does not exist at runtime, silently discarding checkpoint state whenever a checkpoint file existed → `readFileSync`. Re-fixed regressions reintroduced by the 2026-08-21 template upgrade despite being fixed on 2026-08-15: `sync-md.ts` missing module marker (`export {}`, 8 TS1375 errors), `render-pdf-deck.ts` DOM lib reference (2 TS2584 errors) — typecheck errors reduced 44→33 (remaining are core-script typing debt requiring workspace-root fixes; `dev-sync.ts` is immutable in L2 variants). `.github/workflows/ci.yml` gained explicit `permissions: contents: read`. `docs/context.md`: filled creation-time placeholders (project name/description/type) and replaced dead lifecycle links with audit commands. Post-fix gates: audit PASS, docs-links PASS, lifecycle-sync PASS, tests 88/88.
- **[2026-08-21]**: chore(upgrade): synced template infrastructure via `upgrade-project.ts` (workspace common → 0.5.3 latest) — `docs/context.md` v2.0 → v2.4 (picks up the Context Commonization Review process and the promoted "Git / PR Workflow" section), several `scripts/` updated (`dev-sync.ts`, `sync-md.ts`, `lifecycle-sync-audit.ts`, `readme-lifecycle-audit.ts`, `analyze-git-history.ts`, `hooks/pre-commit.ts`, `hooks/pre-push.ts`), new `scripts/helpers/context-sections.ts` dependency added. Manually reconciled 7 script version mismatches the upgrade left in `scripts/SCRIPTS.md` (file content synced but registry versions weren't — a known gap noted in `skills/upgrade-project/SKILL.md`'s Post-Upgrade Verification step). **`.gitleaks.toml`** was blindly overwritten by the upgrade's LOCKED-file category, silently dropping two project-specific allowlist entries (the `scratch/` ABAP vendor-code path exclusion and the SAP developer-trial default-credential regex) — this blocked the push with 70 false-positive "leaks" against 2026-05-05 history (ABAP struct-field syntax like `ls_dm45l-spezid` tripping the generic-api-key rule). Both entries restored; `gitleaks detect` confirms 0 leaks. Filed as a real gap in `upgrade-project.ts`'s design: `.gitleaks.toml` needs project-aware merging, not unconditional overwrite. `bun scripts/audit.ts` passes clean.
- **[2026-08-18]**: fix(scripts): `scripts/co-abap/dispatch-parallel.ts` and `dispatch-serial.ts` (ADR-0050 variant wrappers) imported the common dispatchers via `../../dispatch-*.ts` — resolving to the project root instead of `scripts/`, making both wrappers unimportable (`bun scripts/co-abap/dispatch-parallel.ts --help` failed with "Cannot find module"). Corrected to `../dispatch-*.ts`. Ported from ai-workspace-standards PR #557 (template-side fix).


### Fixed
- **[2026-08-18]**: fix(git): add `merge=union` union merge drivers to `.gitattributes` for the append-only pipeline files (`CHANGELOG.md`, `memory/*.md`, `docs/VERSION_MANIFEST.md`, `scripts/README.md`) to prevent recurring merge conflicts when parallel PR branches both update the same anchor lines on every `/sync`. Union merge auto-combines both sides' content instead of raising conflict markers; transient duplicates in fully-regenerated files are overwritten at the next sync. Ported from `ai-workspace-standards` PR #556.
- **[2026-08-17]**: fix(upgrade): synced `Projects/co-abap` to template v0.5.3 via the fixed `upgrade-project.ts` (workspace 1.8.0→1.8.1). Migrated `scripts/SCRIPTS.md` from a legacy 4-column format (`Script | Version | Purpose | Layer`) to the current 8-column schema — the old format was invisible to `verify-scripts.ts`, so all 80 registered scripts were being reported as "unregistered," blocking the `/sync` audit gate. Also added missing `lifecycle:` frontmatter to 22 `agents/*.md` files (including 2 non-runtime spec docs, `handoff-spec.md`/`handoff-spec_ko.md`, which needed minimal frontmatter added since they aren't matched by `validate-agents.ts`'s README/underscore exclusion list), missing `status`/`owner` fields to 10 `skills/*/SKILL.md` files, and a missing `tier:` block to 18 agents (defaulted to `medium` across claude/gemini/antigravity/gemini-cli — no existing tier mapping was documented anywhere in this project to assign more precisely; **recommend reviewing and adjusting these per-agent** as an intentional follow-up, since `medium` is a safe default, not a considered assignment). Also fixed a broken relative link in `docs/co-abap.context.md` — the `templates/co-abap` source's "Tooling Matrix" reference used a workspace-root-relative path (`../templates/common/docs/_examples/guides/tooling-matrix.md`) that's invalid from a project's `docs/` folder; corrected to the project-local `tooling-matrix.md` (also fixed in `templates/co-abap/docs/co-abap.context.md` so it doesn't recur on the next sync). `bun scripts/audit.ts` — all checks pass. Also fixed the pre-existing (pre-dates this upgrade) `.gitleaks.toml` false-positive blocking `git push` entirely: 70 "leaks" in `scratch/stable/*.abap` vendored reference source (zabapgit, zadt_vsp_git) were local-variable assignments like `iv_key = ls_dm02l-entid` tripping the generic-api-key regex, not real secrets. Added a `(^|/)scratch/` path exclusion to `allowlist.paths`. Also found (via git-history-mode `gitleaks detect`, which scans all 268 commits, not just the working tree) 2 more matches in old commits (2026-05-01) for `docs/setup-guide.md`'s curl example — `DEVELOPER:Down1oad`, SAP's own publicly-documented default credential for the free ABAP developer trial edition, not a real secret; added an allowlist regex for it. **Note**: `.gitleaks.toml` is a LOCKED file overwritten wholesale by `upgrade-project.ts` on every future sync — both exclusions are project-local only and will need to be re-added after the next upgrade unless/until it's decided whether they belong in the shared L0 config.

### Changed
- **[2026-08-15]**: chore(upgrade): sync template infrastructure to keep multi-platform support (Claude Desktop App/Claude Code/Antigravity/Antigravity CLI) current — ran `upgrade-project.ts --variant co-abap`, refreshing 47 scripts/skills/agents to latest versions and merging `CLAUDE.md`/`GEMINI.md`/`AGENTS.md` managed sections; `.claude/`, `.gemini/`, `.agents/` platform mirrors re-synced via `sync-skills.ts`; security bootstrap checks passed

### Fixed
- **[2026-08-15]**: fix(gitignore): stop tracking `.zcode/plans/*.md` (Antigravity/ZCode session-local plan files) — added `.zcode/` to `.gitignore` and untracked the 2 files that had been committed; ported from an upstream ai-workspace-standards fix
- **[2026-08-15]**: fix(scripts): `dev-sync.ts` called `.trim()` directly on `Buffer` stderr output (would throw at runtime on any non-empty stderr) and typed `withRetry`'s `isSuccess` callbacks too narrowly for its `unknown`-typed contract; `sync-md.ts` lacked a module marker needed for its top-level `await` to type-check
- **[2026-08-15]**: fix(scripts): `dev-sync.test.ts` and `audit.test.ts` were stray copies of another project's test suite testing nonexistent exports — removed; `sync-skills.test.ts` was similarly mismatched and has been rewritten against this project's actual `dirsEqual`/`syncSkills` API
- **[2026-08-15]**: docs: complete `SCRIPTS.md` version registry — added `@version` headers to the 26 scripts/tests that lacked them and registered all scripts (including previously-untracked ones) with a Version column; removed BOM from `CHANGELOG.md`/`memory/2026-07-05.md`; relocated stray `PR_BODY.md` to `memory/archive/`; removed `CONTRIBUTING.md` and its README references (not applicable to this independent project)
- **[2026-08-15]**: fix(scripts): `dev-sync.ts`'s "PR already exists" check (`gh pr view <branch> --json url`) matched a branch's PR regardless of state — a branch whose PR had already been MERGED was reported as "existing", silently stranding a follow-up commit with no open PR. Added a `state == OPEN` filter via `--jq` so a merged/closed PR is treated the same as no PR, and a fresh one gets created
- **[2026-08-15]**: fix(githooks): `commit-msg`/`commit-msg.ps1`'s duplicate-entry guard checked for a `"## <commit message>"` heading in today's memory log, but `dev-sync.ts`'s own log entry uses a fixed `## Session Summary` heading with the message as body text — the guard never matched dev-sync's format, so every `/sync` run appended a second, differently-formatted memory-log entry for the same commit. Now matches the raw message text regardless of which writer produced it. Also fixed a PowerShell `-and` short-circuit bug in `commit-msg.ps1` that would throw on the first commit of a new day (memory file not yet created)
- **[2026-08-15]**: fix(scripts): ported `vsp-publish.sh`/`vsp-publish.ps1` to `scripts/vsp-publish.ts` — the asset list still referenced `scripts/*.ps1`/`scripts/*.sh` files (`install-vsp`, `sync-md`, `vsp-audit`, `vsp-task`) that no longer exist after the ADR-0036 TypeScript migration, so the plugin-publish step was silently skipping all four scripts. Updated the list to the current `.ts` filenames

### Removed
- **[2026-08-15]**: chore(githooks): removed `.githooks/commit-msg.ps1` — this workspace's documented policy is Git Bash on Windows (`.githooks/` hooks are `.sh`-only); the divergent PowerShell copy is exactly what let the duplicate-entry bug above go unnoticed on the bash side while independently carrying its own short-circuit bug
- **[2026-08-15]**: chore: removed `scratch/stable/check-encoding.ps1`, a one-off diagnostic script whose UTF-8 BOM check is already covered by `audit.ts`
- **[2026-08-15]**: chore: removed `scripts/vsp-publish.sh`/`scripts/vsp-publish.ps1` (superseded by `scripts/vsp-publish.ts`) — this repo now has zero `.sh`/`.ps1` files outside `.githooks/` (which remain bash-only per policy)

### Changed
- **[2026-08-15]**: --body-file .git/sync-pr-body.md fix(gitignore): stop tracking .zcode session-local state

- **[2026-08-15]**: chore: update PM persona, bump version, and minor doc/config tweaks

### Added
- **[2026-07-10]**: docs: update README/README_ko with post-write coverage gate, RTM automation, and CI quality gates

- **[2026-07-10]**: feat: harden test/CI coverage, activate RTM workflow, and add SAP performance/dump-monitoring/coverage/threat-model enhancements

- **[2026-07-10]**: Test coverage for `dev-sync.ts`, `sync-skills.ts`, `audit.ts`, `scratch-cleanup.ts` (previously untested git/file-mutating scripts) — 114 tests now pass across 9 files
- **[2026-07-10]**: `bun run typecheck` (tsc --noEmit) added and wired into CI; fixed pre-existing type errors in `dispatch.ts` and `install-vsp.ts`
- **[2026-07-10]**: CI now runs on an ubuntu/windows matrix, plus new MCP-drift and 3-platform skill-distribution-drift checks and a dedicated gitleaks secret-scan job
- **[2026-07-10]**: `scripts/new-requirement.ts` — scaffolds `deliverables/REQ-NNN-slug/01_srs.md` and registers an RTM row; wired into `/triage` for requests classified as new functional scope
- **[2026-07-10]**: `GetCodeCoverage` gate added to the Post-Write Mandatory Chain (70% threshold on new objects, regression check on existing ones, waiver-with-justification path)
- **[2026-07-10]**: `skills/performance-tuning/SKILL.md` — standardized TraceExecution/ListSQLTraces/GetCallGraph workflow for slow-program and large-table performance analysis, owned by `dba`
- **[2026-07-10]**: `skills/dump-monitor/SKILL.md` — standardized ListDumps/GetDump health-check workflow routed into `/triage`, owned by `devops-admin`
- **[2026-07-10]**: Threat model section added to `SECURITY.md` — destructive-operation approval gates, package/feature whitelist policy, secrets handling, RFC call governance

### Fixed
- **[2026-07-10]**: fix: correct cross-platform doc-drift — SKILLS.md path bug, AGENTS.md/test-runner.md stale post-write chain refs

- **[2026-07-10]**: fix: harden auto-merge workflow, add sync-mcp.ts, and close review remediation gaps


---

## [1.0.0] — 2026-07-10

First stable release cut — consolidates all changes accumulated since 0.5.0 (2026-05-20).

### Added
- **[2026-07-08]**: feat: add .agents/skills/ and sync-skills.ts for 3-platform skill distribution
- **[2026-07-05]**: feat: implement deliverables workflow and templates
- **[2026-07-05]**: feat: expose skills to gemini and fix verify-skills.ts
- **[2026-07-01]**: docs: port mig improvements and fix encoding regressions
- **[2026-07-01]**: Ported agent lifecycle CLI scripts (`scripts/agent-create.ts`, `scripts/agent-delete.ts`, `scripts/agent-list.ts`, `scripts/agent-verify.ts`), docs/skills README indexes with Korean translations, and root `package.json`/`bun.lock` from the `co-abap_mig` sibling project.
- **[2026-05-25]**: docs: comprehensive documentation improvement and synchronization
- **[2026-05-24]**: Bun-based single-source scripts (.ts) replacing dual .sh/.ps1 maintenance — health-check.ts, audit.ts, sync-mcp.ts, memory-index.ts
- **[2026-05-24]**: `.mcp.json` as Single Source of Truth for MCP configuration across all platforms (Claude Code, Gemini, Antigravity)
- **[2026-05-24]**: MCP sync script (sync-mcp.ts) for automatic settings synchronization from .mcp.json to platform-specific configs
- **[2026-05-24]**: Health check script (health-check.ts) for system monitoring and version verification
- **[2026-05-24]**: Memory index auto-updater (memory-index.ts) for maintaining memory/MEMORY.md index
- **[2026-05-24]**: Desktop App fallback skill for manual QA when PostToolUse hooks don't fire
- **[2026-05-24]**: Agent dispatch templates and handoff specification for standardized subagent coordination
- **[2026-05-24]**: Skills index (SKILLS.md) documenting all available skills and their entry points
- **[2026-05-24]**: MCP workflow references updated in CLAUDE.md and GEMINI.md to reflect .mcp.json SSoT approach
- **[2026-05-24]**: Pre-commit hook now checks MCP configuration drift between .mcp.json and platform-specific configs
- **[2026-05-23]**: `.githooks/pre-commit`: Add Markdown date auto-bumper and CHANGELOG auto-dating logic. Automatically updates `Last Updated:` date in staged `.md` files upon commit, and injects date into undated `CHANGELOG.md` entries.
- **[2026-05-23]**: `docs/context.md`: Add `security-monitor` (Security group) to Agents table.
- **[2026-05-23]**: `AGENTS.md`: Register `security-monitor` agent formally in the global Agent Roster.
- **[2026-05-23]**: Standardize session start checklist in CLAUDE.md to 6-step format (git config, CONSTITUTION, context, AGENTS, memory, skills)
- **[2026-05-23]**: Add `## Session Start Skills` section to docs/context.md for all-tool auto-discovery
- **[2026-05-23]**: Expand GEMINI.md with tool safeguards, Planning Mode artifacts, and Subagent orchestration

### Changed
- **[2026-07-08]**: chore: bump devDependencies (@types/node, typescript)
- **[2026-07-05]**: docs: update memory log and skills index
- **[2026-07-05]**: docs: map 3-tier model strategy to subagent execution plans
- **[2026-07-03]**: chore: sync ABAP inventory scratch work, meeting command, and repo housekeeping
- **[2026-07-03]**: Add Desktop App manual post-write chain guide to `CLAUDE.md`
- **[2026-07-03]**: Add `metadata.type` to all 9 skill frontmatters (core/module)
- **[2026-07-03]**: Document `.mcp.json` tracking policy in `docs/context.md`
- **[2026-05-25]**: Established **Hybrid Scripting Automation** model. Utility scripts (`dev-sync`, `audit`) reverted to native PowerShell/Bash for simplicity, while agent orchestration (`dispatch`, `retry-handler`, `verify-skills`) remains in Bun (.ts) for complex async handling. *(Superseded by ADR-0036 — all scripts are TypeScript.)*

### Fixed
- **[2026-07-08]**: fix: pre-push hook checks destination ref instead of current branch
- **[2026-07-03]**: Remove broken wrapper scripts (`health-check.sh`, `sync-mcp.sh`) that referenced non-existent TypeScript targets
- **[2026-07-03]**: Fix `dispatch-serial.ts` double-execution bug (pipeline ran twice per invocation)
- **[2026-07-03]**: Add CI status check and 2-approval minimum to `auto-merge.yml` workflow
- **[2026-07-03]**: Add `vsp.exe` to `.gitignore` and remove from git tracking
- **[2026-07-03]**: Update `SKILLS.md` index — remove 9 phantom skills, add `meeting-facilitation`, document slash commands
- **[2026-07-03]**: Fix Codex skill path from `docs/` to `skills/` in `.codex/config.toml`
- **[2026-07-03]**: Add `PostToolUse` hook to `.claude/settings.json` for automated post-write audit
- **[2026-07-03]**: Fix agent count (`19` -> `20`) and skill count (`8` -> `11`) in `docs/context.md`
- **[2026-07-03]**: Rewrite `security-monitor.md` for SAP/ABAP domain with proper YAML frontmatter
- **[2026-07-03]**: Fix AGENTS.md section numbering gap (Security Monitor #10, GUI Scripter #11)
- **[2026-07-03]**: Fix Unicode encoding in `setup.ps1` header stack table, add Go/Rust/Elixir documentation
- **[2026-07-03]**: Replace realistic password example with placeholder in `.env.sample`
- **[2026-07-03]**: Populate `SECURITY.md` version support table with vsp >= 2.38
- **[2026-07-01]**: Restored UTF-8 encoding corruption (stray BOM + mangled em-dash/arrow/section-sign characters) in `agents/pm.md`, `CLAUDE.md`, `GEMINI.md` introduced by a prior partial migration pass.
- **[2026-07-01]**: Fixed a literal `\n` regression duplicating two table rows in `scripts/README.md`.
- **[2026-07-01]**: Fixed a pre-existing typo in the `scripts/setup.ps1` header comment.
- **[2026-05-25]**: fix: test changelog and memory automation

### Deprecated
- **[2026-05-24]**: Dual .sh/.ps1 script maintenance — use .ts scripts with Bun runtime instead (legacy wrappers retained for compatibility)

### Removed
- **[2026-05-23]**: `README.md` / `README_ko.md`: Remove obsolete manual kickoff instruction text.

### Added (2026-05-23 Antigravity Project Configuration Support)
- **[2026-05-23]**: `.gemini.settings.json.sample`: Created a template for Antigravity 2.0 and Gemini CLI project-level configuration to streamline setup for new workspaces.

### Changed (2026-05-23 Antigravity Project Configuration Support)
- **[2026-05-23]**: `docs/antigravity-setup.md`: Updated to state that Antigravity 2.0 (and CLI) now supports project-level configs via `.gemini/settings.json`, no longer strictly requiring user-level VS Code settings.
- **[2026-05-23]**: `docs/setup-guide.md`: Updated Appendix A and cross-references to point Antigravity configurations to `.gemini/settings.json`.

### Fixed (2026-05-23 MD Consistency Audit)
- **[2026-05-23]**: `CLAUDE.md`: Removed outdated legacy `commands/` folder reference; corrected script delegation path to `audit.ps1`/`audit.sh`
- **[2026-05-23]**: Agent & CLI documents (`AGENTS.md`, `GEMINI.md`, `docs/context.md`, `CLAUDE.md`): Integrated Optimal Interaction Guidelines and Universal Baseline Behaviors for agent workflow consistency

### Fixed (2026-05-23 Audit Script — Relative Link Filter)
- **[2026-05-23]**: `scripts/audit.sh` / `audit.ps1`: Add `../../` relative-path exclusion to markdown link checker — GitHub Security Advisory links (`../../security/advisories/new`) are cross-repo relative URLs, not local file paths, and must be excluded from broken-link validation


### Added (2026-05-23 Project Structure Compliance)
- **[2026-05-23]**: `SECURITY.md`: Security vulnerability reporting policy (CONSTITUTION §1 required file)
- **[2026-05-23]**: `.github/pull_request_template.md`: Standard PR body template (CONSTITUTION §1 required file)

### Fixed (2026-05-22 Windows MCP Config)
- **[2026-05-23]**: `.mcp.json`: `"./vsp"` → `"./vsp.exe"` so Claude Code CLI resolves the binary on Windows
- **[2026-05-23]**: `.claude/settings.json`: PostToolUse hook matcher extended to `Write|Edit|mcp__abap__WriteSource|mcp__abap__EditSource` — ABAP MCP write calls now trigger the sync-md audit script
- **[2026-05-23]**: `.claude/settings.local.json`: Added `enableAllProjectMcpServers: true` alongside existing `enabledMcpjsonServers` list for full compatibility

### Changed
- **[2026-05-23]**: Add ## Architecture, ## Development Workflow, ## Key Files, ## Environment Setup sections to docs/context.md

### Changed
- **[2026-05-23]**: Add standard slash commands, smart pre-commit hook (memory/ exclusion), and Coding Guidelines section to docs/context.md

### Fixed (2026-05-22 Skill Command Wrappers)
- **[2026-05-23]**: `.claude/commands/abap-dev.md`: New wrapper — registers `abap-dev` skill for Skill tool invocation
- **[2026-05-23]**: `.claude/commands/sap-sd/mm/fi/co/le/pp.md`: Six new wrappers — all SAP module skills now invocable via `Skill("sap-*")`
- **[2026-05-23]**: `.claude/commands/post-write.md`: Converted from standalone duplicate to thin wrapper delegating to `skills/post-write-chain/SKILL.md` (single source of truth)

### Changed (2026-05-22)
- **[2026-05-23]**: `scripts/audit.sh` / `audit.ps1`: New standard audit entry point (replaces vsp-audit as primary)
- **[2026-05-23]**: `scripts/vsp-audit.sh` / `vsp-audit.ps1`: Now legacy wrappers delegating to audit.sh/ps1
- **[2026-05-23]**: `scripts/sync-md.sh` / `sync-md.ps1`: Updated to call audit.sh/ps1 directly

### Added (2026-05-22 Inventory Management Design)
- **[2026-05-23]**: `docs/superpowers/specs/2026-05-22-inventory-management-design.md`: Design document for custom inventory management system with Z tables (ZTINV_REQ, ZTINV_REQ_IT, ZTINV_STOCK) handling Goods Receipt and Goods Issue

### Added (2026-05-21 Memory Log)
- **[2026-05-23]**: `memory/2026-05-21.md`: Session log for 2026-05-21 — consistency audit, dispatch-card refactor, BAPI lifecycle expansion, Project Constitution compliance
- **[2026-05-23]**: `memory/MEMORY.md`: Updated index with 2026-05-21 entry; Last Updated bumped

### Added (2026-05-21 Git Hook Configuration)
- **[2026-05-23]**: `.githooks/pre-commit`: Added Git hook to enforce `CHANGELOG.md` updates on every commit.
- **[2026-05-23]**: `.githooks/pre-push`: Added Git hook to block direct pushes to `main` branch; enforces PR-based workflow.
- **[2026-05-23]**: `.github/workflows/auto-merge.yml`: Added GitHub Actions workflow that automatically Squash & Merges a PR when it receives an "Approved" review.

### Added (2026-05-21 Project Constitution Compliance)
- **[2026-05-23]**: `scripts/dev-sync.sh` / `dev-sync.ps1`: Added Project Constitution §3 standard entry-point wrappers delegating to `vsp-sync.sh` / `vsp-sync.ps1`
- **[2026-05-23]**: `docs/context.md`: Added `Project Overview`, `Tech Stack`, `Agents`, and `Skills` summary sections per Project Constitution §7 required sections
- **[2026-05-23]**: `CLAUDE.md`: Added `.claude/commands/` listing with slash command inventory; added note clarifying root `commands/` folder is legacy; updated Last Updated to 2026-05-21

### Changed (2026-05-21 Project Constitution Compliance)
- **[2026-05-23]**: `.claude/commands/sync.md`: Updated script invocation from `vsp-sync.sh` → `dev-sync.sh` to align with Project Constitution §3 standard

### Added (2026-05-21 BAPI Coverage Expansion)
- **[2026-05-23]**: `skills/sap-sd/SKILL.md`: Added `BAPI_SALESORDER_CHANGE` (Sales Order Change) and `BAPI_BILLINGDOC_CREATEMULTIPLE` (Billing Document Creation); expanded `BAPI_OUTB_DELIVERY_CREATE_SLS` stub to full parameter documentation; fixed typo `TARGET_QUY` → `TARGET_QTY` in `BAPI_SALESORDER_CREATEFROMDAT2`
- **[2026-05-23]**: `skills/sap-mm/SKILL.md`: Added `BAPI_PO_CHANGE` (Purchase Order Change) and `BAPI_MATERIAL_SAVEDATA` (Material Master Save); expanded existing BAPIs with additional parameter detail
- **[2026-05-23]**: `skills/sap-fi/SKILL.md`: Added `BAPI_ACC_DOCUMENT_REV_POST` (Document Reversal) and `BAPI_INCOMINGINVOICE_CREATE` (Incoming Invoice / MIRO equivalent); expanded `BAPI_ACC_DOCUMENT_POST` with full parameter detail
- **[2026-05-23]**: `skills/sap-co/SKILL.md`: Added `BAPI_COSTCENTER_CHANGE` (Cost Center Change) and `BAPI_INTERNALORDER_CREATE` (Internal Order Create); expanded existing BAPIs with additional parameter detail
- **[2026-05-23]**: `skills/sap-pp/SKILL.md`: Added `BAPI_PRODORD_RELEASE` (Production Order Release) and `BAPI_PRODORD_COMPLETE_CONF` (Production Order Confirmation)
- **[2026-05-23]**: `skills/sap-le/SKILL.md`: Added `BAPI_OUTB_DELIVERY_CONFIRM_DEC` (Delivery Goods Issue Confirmation/Cancellation) and `BAPI_WHSE_TO_CONFIRM` (WM Transfer Order Confirmation)

### Changed (2026-05-21 PM card + Architect Technical Lead)
- **[2026-05-23]**: `AGENTS.md`: PM entry converted to dispatch-card format — removed redundant §5 Finalization steps and Responsibilities bullets (detail lives in `agents/pm.md`); added `Entry point` and `Subagent prompt` fields
- **[2026-05-23]**: `AGENTS.md`: Architect designated as **Technical Execution Lead** — role explicitly stated in Technical Group intro and Architect card; added `Technical Lead responsibilities` field
- **[2026-05-23]**: `agents/architect.md`: Opening statement updated to reflect Technical Execution Lead role — single point of contact between PM and Technical Group

### Changed (2026-05-21 AGENTS.md Refactoring)
- **[2026-05-23]**: `AGENTS.md`: Refactored Business Group analyst entries (SD/LE/PP/MM/FI/CO) to dispatch-card format — removed redundant `Allowed Tools` and `Output Format` skeleton blocks; renamed `Context file` → `Subagent prompt`; deduplicated trigger keyword lists
- **[2026-05-23]**: `AGENTS.md`: Refactored Technical Group entries (Architect/ABAP Developer/QA Engineer/DBA/DevOps/Intelligence Investigator/Interface Expert/Fiori Developer/Form Expert/GUI Scripter) to dispatch-card format — replaced `Responsibilities` detail bullets with `When to dispatch` + `Output` summary; added missing `Subagent prompt` links to all agents (`code-writer.md`, `test-runner.md`, `dba.md`, `devops-admin.md`, `sap-investigator.md`, `interface-expert.md`, `fiori-developer.md`, `form-expert.md`, `gui-scripter.md`)
- **[2026-05-23]**: `AGENTS.md`: Added Technical Group intro note directing readers to `agents/*.md` for full behavioral rules
- **[2026-05-23]**: `AGENTS.md`: Updated Last Updated to 2026-05-21

### Fixed (2026-05-21 Consistency Audit)
- **[2026-05-23]**: `GEMINI.md`: Removed `browser_subagent` reference from Multi-Agent Coordination section; corrected "single tool" description — hyperfocused mode exposes all 101 operations via `sap_execute`
- **[2026-05-23]**: `docs/tooling-matrix.md`: Removed `browser_subagent` from PM dispatch cell and Default Rule note; renamed "Web research / browser subagent" row to "Web research"; updated Last Updated to 2026-05-20
- **[2026-05-23]**: `docs/setup-guide.md`: Removed `browser_subagent` from §8-C; corrected Appendix B mode table (hyperfocused = "101 ops via sap_execute", not "1 tool"); fixed `VSP_MODE` → `SAP_MODE` in Appendix B; clarified §5-D note; updated to version 1.7 / 2026-05-20
- **[2026-05-23]**: `docs/plugin-setup.md`: Fixed `VSP_MODE` → `SAP_MODE` and `VSP_ALLOWED_PACKAGES` → `SAP_ALLOWED_PACKAGES` in §3 `.env` template
- **[2026-05-23]**: `docs/mcp_usage.md`: Fixed `VSP_FEATURE_TRANSPORT/RAP/UI5` → `SAP_FEATURE_*` throughout Specialized Tools section; corrected Mode Selection Guide to accurately describe hyperfocused as 101-op routing
- **[2026-05-23]**: `AGENTS.md`: Removed non-existent `harness:memory-intelligence` skill reference from Intelligence Investigator; fixed CO trigger keyword `CSKP` → `CSKB`; corrected Role Boundary Matrix: "Analyse ABAP source logic" now maps to `architect` (not `sap-investigator`)
- **[2026-05-23]**: `agents/sap-investigator.md`: Fixed CO pattern `CSKP` → `CSKB`; added `GetSource` to tools list for pattern-context verification
- **[2026-05-23]**: `docs/testing-guidelines.md`: Fixed §Logging ATC Results to reference "active task file" not "task-template.md"; updated Last Updated to 2026-05-20
- **[2026-05-23]**: **C-08 verified non-issue**: `agents/architect.md` already contained `GetCDSImpactAnalysis` — no change needed

### Fixed
- **[2026-05-23]**: `AGENTS.md`: Removed 5 incorrect `browser_subagent` references from Form Expert, GUI Scripter, Fiori Dev (Design Mode), and Dispatch Sequences table — tool does not exist in vsp MCP server (IMP-01)
- **[2026-05-23]**: `docs/context.md`: Clarified that `hyperfocused` mode registers all 101 individual MCP tools, not a single unified tool — addresses Interface Expert tool availability concern (IMP-02)

### Added
- **[2026-05-23]**: `AGENTS.md`: Cross-Module Integration Orchestration section — parallel activation rule, PRD ownership policy, primary analyst designation, and 4 standard scenario templates (SD-FI, MM-FI, SD-LE, PP-MM) (IMP-09)
- **[2026-05-23]**: `docs/context.md`: Deployed vsp Binary version table (`v2.38.1`, built 2026-04-07) (IMP-05)
- **[2026-05-23]**: `docs/context.md`: Canonical ABAP SQL Reference section for all agents (DESCENDING, max_rows, tilde notation, anti-patterns) (IMP-08)
- **[2026-05-23]**: `scripts/vsp-audit.ps1` / `vsp-audit.sh`: Check 6 — reports vsp binary version on each audit run (IMP-05)
- **[2026-05-23]**: `agents/architect.md`: Pattern C partial-failure rollback procedure — 5-step recovery process when multi-object refactor aborts mid-sequence (IMP-04)
- **[2026-05-23]**: `docs/testing-guidelines.md`: ATC Priority-2 Escalation Workflow — three disposition options (Fix / Suppress-with-justification / Defer) with recording location and decision criteria (IMP-03)
- **[2026-05-23]**: `docs/testing-guidelines.md`: ABAP Unit Test Skeleton section with method naming convention and AAA pattern reference (IMP-10)
- **[2026-05-23]**: `scratch/stable/z_unit_test_skeleton.clas.abap`: Reference ABAP Unit test skeleton with TEST-SEAM injection pattern (IMP-10)
- **[2026-05-23]**: `agents/sap-investigator.md`: 6 cross-module pattern groups — SD-FI, MM-FI, SD-LE, PP-MM, LE extended, PP extended (IMP-06)
- **[2026-05-23]**: `skills/sap-co/SKILL.md`, `sap-pp/SKILL.md`, `sap-le/SKILL.md`: Strategic BAPIs & APIs section added to complete all 8 required skill sections (IMP-07)
- **[2026-05-23]**: `scratch/tasks/task-2026-05-20-001` through `-010`: Task handoff files for all 10 improvement items from 2026-05-20 all-hands review meeting

### Changed
- **[2026-05-23]**: `agents/test-runner.md`: ATC P2 standard updated to reference new escalation workflow (IMP-03)
- **[2026-05-23]**: `docs/task-template.md`: Rollback Plan table added to §2 Technical Design; P2 Disposition field added to §4.2 ATC Check Results (IMP-03, IMP-04)
- **[2026-05-23]**: `agents/read-only-analyst.md`: Inline ABAP SQL Quick Reference replaced with canonical reference pointer to `docs/context.md` (IMP-08)
- **[2026-05-23]**: `agents/dba.md`: SQL syntax rule reference added to behavior rules (IMP-08)
- **[2026-05-23]**: `agents/interface-expert.md`: Confirmed tool availability note added to `## Your Tools` section (IMP-02)

---

## [0.5.0] — 2026-05-20

### Fixed
- `docs/setup-guide.md §9`: Rewrote ZADT_VSP installation section with mandatory order warning (9-A → 9-C → 9-D)
- `docs/setup-guide.md §9-C`: Expanded SAPC and SICF finalization into step-by-step field-by-field guides with exact transaction codes, navigation paths, failure recovery instructions, and `⚠️ mandatory — do not skip` warning
- `docs/setup-guide.md §9-D`: Added failure checklist (SAPC handler, SICF active status, `S_BTCH_ADM` authorization)
- `docs/setup-guide.md §12`: `VSP_ALLOWED_PACKAGES` → `SAP_ALLOWED_PACKAGES` (prefix consistency)
- `docs/antigravity-setup.md`: `VSP_MODE`, `VSP_ALLOWED_PACKAGES`, `VSP_FEATURE_*` → `SAP_*` prefix throughout
- `scripts/install-vsp.sh`: Added step 4 in Next steps — ZADT_VSP install and SAP GUI finalization reminder with §9-C reference; corrected example port `8080` → `44300`
- `scripts/install-vsp.ps1`: Same as above for Windows

### Changed
- `AGENTS.md`: Strengthened preamble with explicit `⚠️ For AI tools reading this file` warning — clarifies this is a registry/orchestration reference, not behavioral instructions; redirects each tool to its own config file (`CLAUDE.md`, `GEMINI.md`, `.codex/config.toml`)
- `AGENTS.md`: Subtitle updated from "Agent Definitions" to "Agent Registry & Orchestration Contract"

---

## [0.4.0] — 2026-05-19

### Added
- `docs/tooling-matrix.md`: New file — Tool Selection Rule table and Hook Behavior table comparing Claude Code CLI, Desktop App, Gemini CLI, and Antigravity
- `AGENTS.md`: Agent Role Boundary Matrix — research agent disambiguation, technical agent boundaries, analyst trigger keywords, and escalation rules
- `docs/context.md`: Directory Reference table documenting all 9 project directories with Git-tracking status
- `docs/context.md`: Documentation Language rule extended to cover git artifacts (commit messages, PR titles, branch names)
- `C:/git/CLAUDE.md`: Git Conventions section requiring English for all git artifacts

### Fixed
- `agents/pm.md`: `color: gold` → `color: yellow`; removed non-existent `browser_subagent` tool reference
- `agents/devops-admin.md`: `color: orange` → `color: yellow`
- `agents/dba.md`, `read-only-analyst.md`, `sap-investigator.md`, `schema-inspector.md`: `color: purple` → `color: magenta`
- `.codex/config.toml`: All `VSP_*` env vars → `SAP_*` prefix (`VSP_MODE` → `SAP_MODE`, etc.)
- `scripts/vsp-audit.ps1`: Enforced script pairing (removed `sync-md` exemption, activated `$failed = $true`); added Check 5 — MCP prefix consistency
- `scripts/vsp-audit.sh`: Removed `install-vsp` exemption from pairing check; added Check 5 — MCP prefix consistency

---

## [0.3.0] — 2026-05-19

### Added
- `docs/plugin-setup.md`: Dedicated plugin installation guide (marketplace vs. standalone flows)
- `scripts/vsp-publish.sh` / `.ps1`: Automated packaging and publishing pipeline scripts
- `scripts/sync-md.sh` / `.ps1`: Cross-platform hook wrapper for PostToolUse audit trigger
- `docs/tooling-matrix.md`: Initial tooling comparison (superseded by v0.4.0 version)

### Changed
- `AGENTS.md`: Consolidated common session rules (memory logging, documentation language, file isolation, post-write chain, git reflection) into single authoritative section
- `docs/context.md`: Established as single source of truth for shared engineering content; removed duplicated sections from `CLAUDE.md` and `GEMINI.md`
- `CLAUDE.md` / `GEMINI.md`: Reduced to platform-specific adapter files with links to `docs/context.md`
- MCP documentation server domains updated to `marianzeis.de` endpoints (`mcp-abap.marianzeis.de`, `mcp-sap-docs.marianzeis.de`)
- `scratch/` restructured into `scratch/tasks/` (active task files), `scratch/stable/` (read-only ABAP snapshots), `scratch/temp/` (throwaway, not committed)

### Fixed
- `scripts/vsp-audit.ps1`: Script pairing check hardened; `.ps1` / `.sh` pair enforcement activated
- `scripts/vsp-audit.sh`: Script pairing check fixed for Windows Git Bash compatibility
- `.mcp.json.sample`: MCP URLs corrected to live `marianzeis.de` endpoints
- Agent YAML frontmatter errors corrected across multiple agent files
- Git worktree paths repaired in hook configuration

---

## [0.2.0] — 2026-05-19

### Added
- `agents/interface-expert.md`: New Interface Expert agent for RFC/BAPI/IDoc integration
- Subagent parallel execution framework: `§0-A` dispatch block pattern in `AGENTS.md`
- SAP module analyst agents elevated with full execution context (SD, MM, FI, CO, PP, LE)
- `scripts/`: `vsp-sync.sh` / `.ps1`, `vsp-task.sh` / `.ps1`, `vsp-audit.sh` / `.ps1`
- `.claude/settings.json`: Team-shared permissions committed to repo
- `.codex/config.toml` and `.codex/hooks.json`: Codex tool configuration
- `docs/setup-guide.md`: Comprehensive multi-platform environment setup guide (SAP, Claude Code, Gemini CLI, Antigravity)
- `docs/antigravity-setup.md`: Antigravity VS Code extension configuration guide
- `docs/security.md`: Security and sanitization rules
- `docs/mcp_usage.md`: MCP tool usage patterns and critical limitations (ABAP SQL syntax)

### Changed
- `AGENTS.md`: PM-led governance model established; triage → dispatch → QA → finalization workflow
- `README.md`: Updated with Harness Engineering concept and PM-led workflow
- SAP connection config migrated from `.vsp.json` to `.env` file

### Fixed
- `ZCL_VSP_APC_HANDLER`: Added `S_DEVELOP` authority check for security hardening
- `ZPROG_SBOOK_QUERY`: Refactored to OO-ABAP pattern

---

## [0.1.0] — 2026-05-01

### Added
- Initial commit: vsp ABAP development harness framework
- `docs/context.md`: Shared engineering context (vsp build commands, codebase map)
- `AGENTS.md`: Initial agent role definitions (Business Group + Technical Group)
- `CLAUDE.md`: Claude Code configuration
- `GEMINI.md`: Gemini CLI configuration
- `agents/`: Core agent definitions — pm, architect, code-writer, dba, devops-admin, fiori-developer, form-expert, gui-scripter, test-runner, read-only-analyst, sap-investigator, schema-inspector
- `agents/`: SAP module analysts — sd, mm, fi, co, pp, le
- `skills/abap-dev/SKILL.md`: SAP development workflows and MCP optimization
- `skills/post-write-chain/SKILL.md`: Mandatory QA chain (SyntaxCheck → RunUnitTests → RunATCCheck)
- `commands/`: triage, new-task, sync, transport, post-write, memlog, celebrate
- `.mcp.json`: MCP server configuration (vsp hyperfocused mode, abap-docs, sap-docs)
- `memory/`: Date-stamped development log directory
- `scratch/`: Working directory for ABAP sources and task files
- `LICENSE`: AGPL-3.0-only





## [Unreleased]

### Added
- **[2026-08-29]**: feat(skills): **Skill relationship graph adoption (reledgev wave, upstream ADR-0060 Amendments 3–6).** Graph pipeline scripts refreshed (generate-skill-graph 1.7.0, verify-skill-graph 1.5.0, validate-skills 1.3.0, validate-decisions 1.0.0); typed `relates_to` relations adopted for skills whose upstream definitions gained them (procedure-derived follows/composes_with); `docs/skill-graph.overrides.json` seeded with the fail-closed reason/since/90-day policy; `docs/context.md` gains the Skill Relationship Graph section; adoption recorded in docs/adr/ (per-project ADR). Project graph regenerated and determinism-verified.

### Added
- **[2026-08-29]**: feat(procedures): **Procedure corpus adoption (ADR-0063).** Variant workflow procedures copied into `procedures/` (add-if-missing); project skill graph regenerated — procedure/output_type nodes and step_uses_skill/produces edges now present; determinism-verified. Adoption ADR addendum records the wave.

# Project Review — co-abap — 2026-10-10

**Date**: 2026-10-10
**Scope**: variant project (detached L3, template 0.14.0), full
**Method**: 4 parallel agents (architect, read-only-analyst for standards, devops-admin, security-monitor) + machine battery
> Analysis only — no files modified in this report.

## Baseline

| Check | Result |
|-------|--------|
| `bun scripts/review-baseline.ts` | PASS (audit, verify-scripts, agent/skill lifecycle, typecheck); validate-templates and propagate-to-templates N/A |
| `bun scripts/audit.ts` | PASS (1 SKIP: design-lint, no scan roots) |
| `bun test` | 33 pass, 0 fail |
| `bun scripts/validate-docs-links.ts --all` | **12 broken links** in `docs/governance/agents/*.md` (not run by audit or CI — see H-1) |
| base-map MCP | not available |

## Review Results

### 🔴 Critical
None.

### 🟡 High

| # | Issue | Agent | File:Line | Class | Fix |
|---|-------|-------|-----------|-------|-----|
| H-1 | Docs link gate never runs in L3 projects: audit gates it on `CONSTITUTION.md && !variant.json`, CI runs only audit, review-baseline has no link check; 12 broken links went unnoticed | devops-admin, security-monitor | `scripts/audit.ts:2277`, `.github/workflows/ci.yml`, `scripts/review-baseline.ts` | script-gap | Add `validate-docs-links.ts --all` to `l3BaselineChecks()` and a CI step; log skipped L0 gates (`SKIP: <gate> (not L0)`) |
| H-2 | 12 broken links, 4 root causes: `docs/context.md` relative to wrong base (8), ADR-0099 absent in this repo (1), missing CLAUDE.md §6 heading (1), missing CLAUDE.md/GEMINI.md §5 heading (2) | security-monitor, architect | `docs/governance/agents/workflows.md:17,71,77,161,165,231,237,240`; `execution-plan-templates.md:39,77`; `pm-gateway-workflow.md:30` | one-time (template-managed files → also upstream) | Use `../../context.md`; cite ADR-0099 as workspace-root plain text; add `### 5. Agent Dispatch Rules` / `### 6. Native Sub-agents (Agent Tool)` headings (inside COMMON blocks → upstream) |
| H-3 | CI unit-test job is a silent no-op (expects `test:unit`, package.json has `test`); no typecheck in CI | devops-admin | `.github/workflows/ci.yml`, `package.json` | script-gap | Add `"test:unit": "bun test scripts"`; add `bun run typecheck` CI step |
| H-4 | `dev-sync.ts` has no REST fallback for `gh pr create` / `gh pr view` (GraphQL 403 in cloud sessions; 3 useless retries, exit 1 after a successful push) | devops-admin | `scripts/dev-sync.ts:1392,1449-1476` | systemic (template-managed → upstream) | Fall back to `gh api repos/{slug}/pulls`; skip retries on 403/GraphQL |
| H-5 | Legacy marker `.claude/template-version.txt` still named as L3 criterion (contradicts code and tests) | architect | `skills/project-review/SKILL.md:56` (+5 mirrors), `scripts/SCRIPTS.md:356`, `scripts/lib/upgrade-policy.ts:261` | one-time (UR-2 upstream) | Root `template-version.txt`; already UR-2 |
| H-6 | Skills table points at mirror `.agents/skills/` instead of SSOT `skills/`; sync description lists 2 of 5 mirrors | architect | `docs/co-abap.context.md:107-121,136` | one-time | Point to `skills/<name>/`; list all 5 mirrors as generated |
| H-7 | Agents changed today not version/date-bumped consistently (code-writer, architect 1.0.0; all three `last_updated` 2026-09-25) | read-only-analyst | `agents/code-writer.md:26-28`, `agents/architect.md:25-27`, `agents/security-monitor.md` | script-gap | Bump to 1.1.0, set `last_updated: 2026-10-10`, regenerate manifest; validator should flag content change without version/date bump |
| H-8 | CHANGELOG: duplicate `## [Unreleased]` (line ~397 orphan block); top block lacks `###` subheadings and `(#PR)` references required by docs/context.md | read-only-analyst | `CHANGELOG.md:10,397` | script-gap | Merge/relocate orphan block; group entries; add `(#190)`/`(#191)`; validator for single Unreleased heading and format |
| H-9 | gitleaks allowlists `scratch/`, contradicting SECURITY.md (scratch/stable and memory must be scanned); tracked VSP setup guide and large ABAP exports unscanned | security-monitor | `.gitleaks.toml:50`, `SECURITY.md:97-100` | one-time | Remove/narrow allowlist; run `gitleaks detect --no-git` baseline |
| H-10 | Auto-merge default `AUTOMERGE_MIN_APPROVALS=0` with no fork guard on `workflow_run` path | security-monitor | `.github/workflows/auto-merge.yml:6,13,31,43` | one-time (needs owner decision) | Add same-repo `head_repository` guard; decide default (design accepted 0 for solo repo) |

### 🟢 Moderate

| # | Issue | Agent | File:Line | Class | Fix |
|---|-------|-------|-----------|-------|-----|
| M-1 | Duplicate, malformed `sync-md.ts` PostToolUse hook (second entry lacks `hooks` array), no timeout | devops-admin | `.claude/settings.json:62-74` | one-time | Remove second entry, add timeout (needs user approval: settings file) |
| M-2 | `.mcp.json`: `./vsp` path differs from setup docs; `graft` not on PATH; third-party doc endpoints blocked by cloud egress; no cloud-session guidance | devops-admin, security-monitor | `.mcp.json`, `docs/setup-guide.md:248`, `docs/antigravity-setup.md:14` | systemic | Document cloud-session limits; `.mcp.local.json` override; SessionStart warning when vsp missing |
| M-3 | review-baseline spawns without timeout | devops-admin | `scripts/review-baseline.ts` | one-time | Pass `timeout` to `spawnSync` |
| M-4 | Plaintext SAP password guidance (`~/.bashrc`, `config.toml`) vs "credentials only in .env" | security-monitor | `docs/antigravity-setup.md:75-79`, `scratch/stable/VSP_SETUP_GUIDE.md:40`, `SECURITY.md:86` | one-time | Standardize on `.env` (chmod 600) or OS keychain |
| M-5 | `.env.sample` enables `SAP_FEATURE_ABAPGIT=on` while samples default privileged features off | security-monitor | `.env.sample:29` | one-time | Set `off` |
| M-6 | Secret-pattern lists differ between pre-rebase, pre-push and pre-commit hooks | security-monitor | `.githooks/pre-rebase:17`, `scripts/hooks/pre-push.ts:181`, `scripts/hooks/pre-commit.ts:343-345` | script-gap | Single shared pattern list |
| M-7 | Korean-only design/plan docs without `lang:` exception | security-monitor | `docs/superpowers/specs/2026-05-22-zsflight-report-design.md`, `docs/superpowers/plans/2026-05-22-zsflight-report.md` | one-time | Translate or add `lang: ko` / `lang_reason: source-material` |
| M-8 | Design-doc status vocabulary inconsistent; superseded remediation doc not marked | architect | `docs/designs/2026-09-26-agents-md-w4-thin-dispatcher-design.md`, `2026-09-28-upgrade-v0.7.0-…`, `2026-09-25/26-project-review-remediation-design.md` | systemic | One vocabulary (proposed/approved/implemented/superseded) |
| M-9 | LOCAL-PATCH protection on upgrade unverified for `scripts/review-baseline.ts` | architect | `scripts/review-baseline.ts:18` | systemic | Confirm upgrade skips LOCAL-PATCH files; file UR-1 |
| M-10 | `pm.md` frontmatter deviates (no `model`, tier missing gemini, version 1.0.0 vs CHANGELOG "1.3.0") | read-only-analyst | `agents/pm.md` | one-time (template-managed) | Reconcile or document scheme |
| M-11 | `abap-dev` `relates_to` duplicate edges; `last_reviewed` stale; most agents lack `last_reviewed` | read-only-analyst | `skills/abap-dev/SKILL.md:14-30` | one-time | Dedupe, regenerate skill graph; define `last_reviewed` policy |
| M-12 | Memory log hygiene: unfilled Skills Used stub, first block "Decisions: None" despite CDS-first decision, Changes lines without reasons | read-only-analyst | `memory/2026-10-10.md:13,18-30` | one-time | Fill stub, record decision, add reasons |
| M-13 | Meeting transcripts say both PROPOSAL and approved/applied; scope line stale | read-only-analyst | `memory/meeting-2026-10-10-*.md:8` | one-time | Status `APPLIED`; update scope line |
| M-14 | Checklist lacks DA-8 naming row; CHANGELOG called CDS-first item `must`, checklist says `should` | read-only-analyst | `docs/clean-abap-checklist.md:117-121`, `CHANGELOG.md` | one-time | Add DA-8 row; correct CHANGELOG wording |

### ℹ️ Low / Improvements
- GEMINI.md duplicate `Cost Optimization` heading; Korean policy examples in English-only governance files (document as exception).
- SECURITY.md Bun version `1.4.2` vs CI `1.4.x`.
- Semantic-layer design: authorize the closing-period break-glass path in the Runtime authorization table; state that `#PRIVILEGED_ONLY` is excluded (stricter than DA-5).
- `VERSION_MANIFEST.md` "Last Modified" from file date masks stale frontmatter dates.

### ✅ Strengths
- Agent roster consistent (21 files = 21 context rows); DA-1..DA-8 only in SSOT, cited elsewhere; all DA anchors resolve.
- Platform mirrors identical to `skills/` (48 skills × 5).
- Registry/manifest versions agree with files; SCRIPTS.md rows map to files with provenance and LOCAL-PATCH notes.
- CI least privilege, SHA-pinned actions, digest-pinned gitleaks, `persist-credentials: false`, frozen lockfile, fail-closed dependency waivers.
- No real secrets in tracked files; `.env` ignored and blocked by pre-commit.
- README / README_ko pairing exact; meeting transcripts preserve dissent verbatim.

## Domain Summary

| Domain | Critical | High | Moderate |
|--------|:-------:|:----:|:--------:|
| Architecture + Scaffolding | 0 | 2 | 2 |
| Standards + Lifecycle | 0 | 3 | 6 |
| Automation | 0 | 3 | 3 |
| Documentation + Security | 0 | 3 (+ link root causes) | 5 |
| **Merged (deduplicated)** | **0** | **10** | **14** |

## Action Wiring

`bun scripts/ticket.ts` is workspace-root only, so deferred items are recorded here and in `memory/2026-10-10.md`.

| Route | Items |
|-------|-------|
| Fix now (pending user approval) | H-2 (local link fixes), H-3, H-6, H-7, H-8, H-9, M-3, M-5, M-12, M-13, M-14 |
| Needs user decision | H-10 (auto-merge default/fork guard), M-1 (`.claude/settings.json`), M-4 (credential storage standard), M-7 (translate vs `lang:` exception) |
| Upstream (template-managed) | H-2 CLAUDE.md/GEMINI.md headings and ADR-0099, H-4 dev-sync REST fallback, H-5 (UR-2), M-9 (UR-1), M-10 |
| Validator-hardening (script-gap) | H-1 docs-link gate for L3; H-3 CI test/typecheck; H-7 version/date bump check on agent content change; H-8 single-Unreleased and entry-format check; M-6 shared secret-pattern list |

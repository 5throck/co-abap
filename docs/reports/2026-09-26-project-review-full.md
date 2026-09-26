# Project Review — co-abap — 2026-09-26
**Date**: 2026-09-26
**Scope**: variant project (co-abap)
**Method**: 4 parallel review agents (Architecture+Scaffolding / Standards+Lifecycle / Automation / Documentation+Security) + machine battery
> Analysis only — no production files were modified during this review.

## Executive Summary

`co-abap` is a clean L3 variant with a healthy registry, working audit and script-verification paths, and a passing script test suite. The principal concern is that its L3 variant contract is incomplete: inherited tooling and documentation still assume template-project assets that are intentionally absent. Automation also has material gaps in CI gating and auto-merge safety. No production fixes were applied in this review.

## Baseline

| Check | Result | Notes |
|---|---|---|
| `bun scripts/audit.ts` | PASS | 52 warnings: 51 CRLF/mixed-line-ending warnings and one placeholder family; audit otherwise passes. |
| `bun scripts/validate-templates.ts` | ERROR (exit 1) | `templates/` is absent; this is inappropriate as an L3 variant baseline. |
| `bun scripts/verify-scripts.ts --verify` | PASS | 134 registered scripts. |
| `bun scripts/agent-lifecycle-audit.ts` | PASS | Scans only 20 of 21 agents; `pm` is excluded. |
| `bun scripts/skill-lifecycle-audit.ts` | PASS | 47 skills, but active-skill review freshness is not covered. |
| Drift script `scripts/propagate-to-templates.ts` | N/A | Not delivered. |
| `bun test scripts` | PASS | 26 tests. |
| `bun run typecheck` | FAIL | Four TypeScript errors. |
| Git | PASS | Working tree clean; `main` aligned with `origin/main`. |

## Review Results

### Critical

| # | Issue | Agent | File:Line | Class | Fix |
|---:|---|---|---|---|---|
| — | No validated critical findings. | — | — | — | — |

### High

| # | Issue | Agent | File:Line | Class | Fix |
|---:|---|---|---|---|---|
| 1 | Type checking fails: `render-pdf-deck.ts` lacks a `document` type, while `validate-agents.ts` and `validate-skills.ts` require an unavailable optional schema validator. CI does not run typecheck or tests. | C | `scripts/render-pdf-deck.ts:239-240`; `scripts/validate-agents.ts:23`; `scripts/validate-skills.ts:19`; `.github/workflows/ci.yml:29-34` | script-gap | Correct the four type errors and add required CI typecheck and test gates. |
| 2 | Auto-merge can merge completed non-success statuses because only `failure`, `in_progress`, and `queued` are blocked. Its retry model does not re-evaluate on CI completion. | C + D | `.github/workflows/auto-merge.yml:62-86` | script-gap | Require every required check to be completed and `success`; prefer branch protection/native auto-merge or re-evaluate on `check_suite`/`workflow_run`. |
| 3 | Gitleaks excludes tracked memory despite the contrary security-policy expectation. | D | `.gitleaks.toml:37-51`; `SECURITY.md:91-94` | systemic | Remove or narrowly scope the exclusion so tracked memory is scanned consistently with policy. |
| 4 | The PM agent escapes lifecycle audit because `findAgentFiles` filters on role/color metadata. | B | `scripts/agent-lifecycle-audit.ts:201-208`; `agents/pm.md:1-12` | script-gap | Scan every frontmatter-bearing agent file and normalize the PM schema. |
| 5 | The L3 baseline contract is broken: project review expects absent `review-baseline.ts`, package aliases, and `propagate-to-templates`; template validation hard-fails when no templates exist. | A + B | `scripts/validate-templates.ts:324-331` | script-gap | Add L3-specific baseline behavior and explicit skip/not-applicable handling. |
| 6 | Documentation names `.agents/skills` as the source of truth, while the actual model is `skills/` flowing to five mirrors. | A | `docs/co-abap.context.md:102,107-122,239`; `docs/context.md:83`; `scripts/sync-skills.ts:34-44` | systemic | Correct template/L3 documentation and add a mirror-parity check. |
| 7 | Active documentation and the desktop-app-fallback skill reference missing `sync-mcp.ts` and `post-write.ts` scripts. | A | `docs/co-abap.context.md:137,212`; `skills/desktop-app-fallback/SKILL.md:59,71-72` | script-gap | Correct the references or restore the scripts; validate documented command references. |
| 8 | Default MCP configuration enables high-privilege SAP features. | D | `.mcp.json:11-15`; `.mcp.json.sample:9-13,21-25,33-37` | systemic | Provide a safe off-by-default profile and require deliberate enablement for privileged SAP operations. |
| 9 | Active skill review freshness is unvalidated: 35 active skills are stale relative to their last commit; for example, `script-lifecycle-manager` was last reviewed on 2026-05-30 but changed on 2026-09-21. | B | `skills/script-lifecycle-manager/SKILL.md` | script-gap | Add active-skill freshness checks comparing `last_reviewed` with relevant change history. |
| 10 | `skills/SKILLS.md` relative links are malformed by prepending `skills/` twice, and the audit’s link-validation claim is overly broad. | D | `skills/SKILLS.md:9-25`; `scripts/audit.ts:275-329` | script-gap | Correct the generator and implement a comprehensive link validator. |

### Moderate

| # | Issue | Agent | File:Line | Class | Fix |
|---:|---|---|---|---|---|
| 11 | Core context/project documentation retains placeholders instead of real project identity. | A + B + D | `docs/context.md:1`; `docs/project.md:9-10` | one-time | Populate project identity through the appropriate generation path. |
| 12 | CI installs Bun from `latest`, and the gitleaks OCI image is tag-pinned rather than digest-pinned. | C + D | `.github/workflows/ci.yml:24-26`; gitleaks OCI reference `:49` | systemic | Pin Bun to an approved version and gitleaks to an immutable digest. |
| 13 | The pre-push hook looks for `tests/*.test.ts`, but tests are under `scripts/tests`. | C | `scripts/hooks/pre-push.ts:213-215` | script-gap | Correct test discovery and add a regression test for the hook path. |
| 14 | Only seven skill lifecycle records exist while 40 active skills lack a record; the L3 audit disables this check. | B | `docs/lifecycle/skills`; `scripts/skill-lifecycle-audit.ts:622,648-655` | script-gap | Establish an L3 lifecycle-record policy and enforce it for active skills. |
| 15 | An agent document has an invalid context-document link. | D | `agents/read-only-analyst.md:105` | one-time | Replace it with `../docs/co-abap.context.md`. |
| 16 | Fifty-one CRLF/mixed-line-ending warnings remain despite the UTF-8/LF policy. | D | Repository-wide audit findings | systemic | Normalize affected files and enforce LF through repository tooling. |
| 17 | A pending auto-merge state may never retry because its trigger is review submission only. | C | `.github/workflows/auto-merge.yml:3-5,72-73` | script-gap | Add a CI-completion trigger or adopt native auto-merge. |

### Low / Improvements

| # | Issue | Agent | File:Line | Class | Fix |
|---:|---|---|---|---|---|
| — | No validated low-priority findings. | — | — | — | — |

### Strengths

| # | Issue | Agent | File:Line | Class | Fix |
|---:|---|---|---|---|---|
| S1 | Git is clean and `main` is aligned with `origin/main`. | Machine battery | Git state | strength | Preserve the clean-baseline practice. |
| S2 | The agent registry/lifecycle material covers 21 agents. | B | Agent registry and lifecycle records | strength | Retain registry coverage while fixing PM discovery. |
| S3 | Skills mirror parity is currently healthy. | A | Skills mirror outputs | strength | Preserve parity with an automated check. |
| S4 | Audit and script-verification paths pass; 134 scripts are registered. | Machine battery | `scripts/audit.ts`; `scripts/verify-scripts.ts` | strength | Keep registry and audit checks in CI. |
| S5 | Script tests pass: 26 tests. | Machine battery | `scripts/tests` | strength | Promote this suite to a required CI gate. |
| S6 | No tracked `.env` files and no secret was detected within the configured gitleaks scope. | D | Repository scan; gitleaks scope | strength | Maintain scanning after narrowing the memory exclusion. |
| S7 | CI uses minimal `contents: read` permissions and SHA-pinned JavaScript actions. | C + D | `.github/workflows/ci.yml` | strength | Continue the least-privilege and immutable-action approach. |

## Domain Summary

| Domain | Status | Summary | Priority |
|---|---|---|---|
| Architecture and scaffolding | Needs attention | L3 variant assumptions are not consistently encoded; source-of-truth documentation conflicts with actual skill mirroring. | High |
| Standards and lifecycle | Needs attention | Agent coverage is nearly complete, but PM discovery and active-skill freshness/lifecycle enforcement are incomplete. | High |
| Automation and CI | Needs attention | Typecheck fails, CI omits essential gates, pre-push discovery is wrong, and auto-merge is unsafe/non-retrying. | High |
| Documentation and security | Needs attention | Placeholder and broken-link cleanup is needed; line-ending policy and MCP/gitleaks posture need hardening. | High |
| Repository hygiene | Good baseline | Git is clean, registry verification passes, tests pass, and no scoped secrets or tracked `.env` files were found. | Maintain |

## Action Wiring

This is an L3 variant; no ticket script was used or proposed.

| Order | Action | Owner area | Acceptance evidence |
|---:|---|---|---|
| 1 | Restore a green typecheck and make typecheck plus `bun test scripts` required CI gates. | Automation | Local commands pass; CI reports both required gates. |
| 2 | Replace custom unsafe auto-merge decision logic with protected required checks/native auto-merge, or re-evaluate on CI completion. | Automation + Security | Non-success, pending, cancelled, skipped, and neutral required checks cannot merge. |
| 3 | Define the L3 baseline contract for absent templates and non-delivered propagation tooling. | Architecture + Lifecycle | L3 validation emits explicit N/A/skip outcomes rather than false errors. |
| 4 | Reconcile source-of-truth documentation, fix placeholders and broken references, and normalize line endings. | Documentation | Generated/project docs identify `skills/` correctly; links and LF policy validate. |
| 5 | Harden security defaults by narrowing gitleaks exclusions, pinning dependencies/images, and making privileged SAP MCP features opt-in. | Security | Policy-consistent scan coverage and reviewed safe-default MCP profile. |
| 6 | Implement the validator-hardening backlog below. | Automation + Lifecycle | Each listed validator has a regression test or deterministic validation result. |

### Validator-Hardening Backlog

All findings classified as `script-gap` should be addressed through concise validator and automation hardening:

1. Add CI typecheck and script-test gates after correcting the current type errors (finding 1).
2. Validate that auto-merge permits only explicitly successful required checks and re-evaluates after CI completion (findings 2 and 17).
3. Discover all frontmatter agent files regardless of optional role/color fields, and validate the PM schema (finding 4).
4. Encode L3-specific baseline/skip behavior for absent templates and variant-only tooling (finding 5).
5. Validate documented script/command references, including skill instructions (finding 7).
6. Compare active-skill review dates with relevant file changes (finding 9).
7. Generate correct relative skill-index links and validate all documentation links comprehensively (finding 10).
8. Correct and test pre-push test discovery against `scripts/tests` (finding 13).
9. Define and enforce lifecycle-record coverage for all active L3 skills (finding 14).

## Conclusion

The reviewed findings were remediated and verified. The project now has a green validation baseline with the L3 contract, CI gates, auto-merge criteria, and security defaults addressed. No commit or push was performed.

## Verification

The remediation design and decision records were created. No commit was made. Implemented fixes include green typecheck and CI gates; safe auto-merge; L3 baseline and lifecycle scope; gitleaks and MCP safe defaults; documentation links, SSOT, placeholders, and LF normalization; regenerated registries; and the link-validator code-fence fix.

| Command | Result |
|---|---|
| `bun scripts/review-baseline.ts --quiet` | PASS |
| `bun run typecheck` | PASS |
| `bun run test` | PASS (35 tests) |
| `bun scripts/verify-scripts.ts --verify` | PASS (138 scripts) |
| `bun scripts/lifecycle-sync-audit.ts` | PASS |
| `bun run verify-skills` | PASS |
| `bun scripts/validate-docs-links.ts --all` | PASS |
| `bun scripts/verify-platform-lifecycle.ts` | PASS |
| `bun scripts/audit.ts` | PASS |
| `gitleaks git --no-banner` | PASS |
| `git diff --check` | PASS |

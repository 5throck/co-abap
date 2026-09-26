# 2026-09-26 Project Review Remediation — Design

**Spec ID**: 2026-09-26-project-review-remediation-design
**Date**: 2026-09-26
**Status**: implemented
**Source**: `docs/reports/2026-09-26-project-review-full.md`
**Decision**: `docs/decisions/DEC-20260926-01.md`

## Context and Scope

This is a separate remediation batch for the 2026-09-26 project review. The
2026-09-25 remediation design is historical and does not define this batch.

The batch addresses the report's high and moderate findings in four change groups:

1. **TypeScript and delivery gates**: restore `bun run typecheck`; require typecheck
   and script tests in CI; correct pre-push test discovery; harden auto-merge so only
   completed successful required checks merge and pending checks are re-evaluated.
2. **L3 baseline and lifecycle behavior**: make L3-inapplicable template/propagation
   checks explicit skips; align project-review commands with delivered scripts; discover
   all frontmatter agents; enforce defined active-skill review and lifecycle-record
   policy.
3. **Security defaults**: scan tracked `memory/` content without a broad exclusion;
   make privileged SAP MCP capabilities opt-in; pin runtime and scanner dependencies
   to reviewed immutable versions.
4. **Documentation and repository hygiene**: align `skills/` as the SSOT for all
   mirrors; remove stale script references; correct relative links and project
   placeholders; normalize tracked text to LF and enforce the policy.

## Non-Goals

- No ABAP business-function or user-facing feature change.
- No redesign of the complete workspace/template hierarchy.
- No retroactive rewrite of the 2026-09-25 historical design or decision records.
- No unrelated refactoring while correcting the reviewed findings.

## Ordering

1. Establish green TypeScript, tests, and CI gates before relying on automation.
2. Harden auto-merge and security defaults before enabling unattended delivery.
3. Define L3 baseline and lifecycle-validator behavior, including deterministic
   `PASS`, `WARN`, or `SKIP` output.
4. Apply documentation, link, placeholder, and LF normalization changes.
5. Run targeted regression tests for every upgraded script or workflow, then run the
   relevant project-review baseline and record verification results.

## Implementation Rules

- Each script, hook, validator, generator, or workflow upgrade must include automated
  regression coverage for the reported failure mode.
- `SKIP` is permitted only for checks demonstrably inapplicable to an L3 project and
  must state the reason; absent tooling must not be reported as a passing check.
- CI and local hooks must invoke the same canonical package commands where practical.
- Security-default changes must remain least-privilege and require deliberate local
  enablement for privileged SAP actions.

## Risks and Rollback

| Risk | Mitigation | Rollback |
|---|---|---|
| New CI gates expose existing failures and delay merges. | Land fixes and regression coverage before marking checks required. | Revert the gate change in a focused PR while retaining diagnostics. |
| Auto-merge hardening leaves eligible pull requests pending. | Test success, failure, cancelled, skipped, and pending check states. | Disable custom auto-merge and use protected/manual merge temporarily. |
| L3 skip logic hides a real validation gap. | Test L3 and template-bearing fixtures; emit an explicit reason. | Revert the scope classifier and run the affected validator manually. |
| MCP or gitleaks defaults disrupt existing local workflows. | Provide documented opt-in overrides and narrow false-positive handling. | Restore the prior local override only, not a broad repository exclusion. |
| LF normalization produces broad diffs. | Isolate normalization from behavior changes and verify content-only diffs. | Revert the normalization-only commit or patch. |

## Implementation Outcome

The remediation is implemented. CI now defines the audit, secret-scan, typecheck,
and script-test gates; auto-merge evaluates the required checks fail closed and
re-evaluates after CI completion. The detached L3 baseline emits explicit N/A results
for L0-only template and propagation checks. Privileged SAP MCP features are off by
default, tracked memory is included in gitleaks coverage, and the repository has
documented link-validation and LF controls.

## Verification

The review report recorded the following final implementation verification as passing.
No GitHub Actions run is asserted by this record.

```text
bun scripts/review-baseline.ts --quiet
bun run typecheck
bun run test
bun scripts/verify-scripts.ts --verify
bun scripts/lifecycle-sync-audit.ts
bun run verify-skills
bun scripts/validate-docs-links.ts --all
bun scripts/verify-platform-lifecycle.ts
bun scripts/audit.ts
gitleaks git --no-banner
git diff --check
```

## Acceptance Criteria

- `bun run typecheck` and the canonical script-test command pass locally and run as
  required CI checks.
- Automated tests cover optional-validator loading, PDF type declarations, pre-push
  test discovery, and each changed validator or workflow decision path.
- Auto-merge rejects every missing, pending, cancelled, neutral, skipped, timed-out,
  action-required, or failed required check; successful checks can be re-evaluated
  after CI completion.
- L3 baseline execution reports template/propagation checks as explicit applicable
  results or justified skips, and lifecycle audits cover all defined project targets.
- Tracked `memory/` content is included in secret scanning; privileged MCP features
  are off by default; pinned tool versions are immutable or otherwise reviewed.
- Documentation identifies `skills/` as the mirror source of truth; documented
  commands and relative links resolve; project identity placeholders are removed.
- Repository text files conform to the LF policy, and a deterministic validation
  prevents regression.

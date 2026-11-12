<!-- LOCAL-PATCH(upstream-request: U-20261112-011): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/ci-triage.md) -->
# Ci-Triage Skill Lifecycle

## Metadata
- **Skill**: ci-triage
- **Status**: active
- **Version**: 0.2.0
- **Created**: 2026-09-08
- **Last Updated**: 2026-11-12

## Description
Lightweight CI / audit / scaffold failure triage loop: deterministic reproduction,
minimal repro, provenance tracing, root-cause fix, re-verification with a
validator-hardening ratchet. Pilot from the 2026-09-08 project-review ecosystem
gap analysis (upstream design: workspace-root `docs/designs/2026-09-08-ci-triage-skill-design.md`).

## Changelog
- **0.2.0** (2026-10-04): minor bump — adds Step 6 "Merge with CI watch" merge-time healing loop (T-20261004-006).
- **0.1.2** (2026-09-21): patch bump — deliver accumulated template content to the fleet (equal-version content drift measured 2026-09-21; upgrade-project 1.37 UPDATE delivery).
- **0.1.1** (2026-09-21): patch bump — deliver accumulated template content that predated this version to the fleet (equal-version content drift measured 2026-09-21; upgrade-project 1.37 UPDATE delivery).
- 2026-09-08: 0.1.0 — initial pilot version.
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC).

## Dependencies
- project-review (escalation path for multi-domain failures)
- sync (fix landing pipeline)
- validator-hardening ratchet tickets — `scripts/ticket.ts` is workspace-root only (L0); in this project the ratchet lands as recorded follow-ups instead

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-09-08 | - | production | Pilot created from project-review ecosystem gap analysis; procedure codified from 2026-09-07 proven practice (upstream) | pm |
| 2026-11-12 | production | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Active Phase
- [x] SKILL.md exists at `skills/ci-triage/SKILL.md`
- [x] Frontmatter valid; triggers distinct from project-review's
- [ ] First real triage invocation recorded in this project (pilot success criterion)

## Metadata
- **Current Phase**: production
- **Version**: 0.2.0
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm

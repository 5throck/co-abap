<!-- LOCAL-PATCH(upstream-request: U-20261112-011): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/platform-command-lifecycle-manager.md) -->
# Platform-Command-Lifecycle-Manager Skill — Lifecycle Record

## Metadata
- **Skill**: platform-command-lifecycle-manager
- **Status**: active
- **Version**: 1.0.3
- **Owner**: pm
- **Created**: 2026-09-04
- **Last Updated**: 2026-11-12

## Description
Guides creation and lifecycle management of platform commands
(`.claude/commands/*.md`, `.gemini/commands/*.md`): frontmatter standards,
parity validation via `scripts/validate-templates.ts`, and lifecycle
trigger bookkeeping.

## Changelog
- **1.0.3** (2026-09-25): patch bump — `.agents/commands` lockstep note added to the Propagation Rule (spec `2026-09-25-propagation-engine-batch-design` §6-D8/R25, ticket T-20260925-003); last_reviewed refreshed.
- **1.0.2** (2026-09-21): patch bump — deliver accumulated template content to the fleet (equal-version content drift measured 2026-09-21; upgrade-project 1.37 UPDATE delivery).
- **1.0.1** (2026-09-21): patch bump — deliver accumulated template content that predated this version to the fleet (equal-version content drift measured 2026-09-21; upgrade-project 1.37 UPDATE delivery).
- 2026-09-04: 1.0.0 — initial version.
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC).

## Dependencies
- `scripts/validate-templates.ts` (parity checks — present in this project)
- `scripts/sync-skills.ts` (distribution — present in this project)

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-09-04 | - | production | Created and validated in same cycle (upstream) | pm |
| 2026-11-12 | production | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Active Phase
- [x] SKILL.md exists at `skills/platform-command-lifecycle-manager/SKILL.md`
- [x] Frontmatter valid; registered in docs/VERSION_MANIFEST.md
- [x] Command parity procedure verified against validate-templates.ts

## Metadata
- **Current Phase**: production
- **Version**: 1.0.3
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm

<!-- LOCAL-PATCH(upstream-request: U-20261113-003): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/platform-skill-lifecycle-manager.md) -->
# Platform-Skill-Lifecycle-Manager Skill — Lifecycle Record

## Metadata
- **Skill**: platform-skill-lifecycle-manager
- **Status**: active
- **Version**: 1.0.2
- **Owner**: pm
- **Created**: 2026-09-04
- **Last Updated**: 2026-11-12

## Description
Guides creation and lifecycle management of platform skills
(`.claude/skills/`, `.gemini/skills/`, `.agents/skills/`): SSOT-first flow
(create in `skills/`, distribute via `scripts/sync-skills.ts`), shortcut-skill
back-sync rules, version pinning, and lifecycle triggers.

## Changelog
- **1.0.2** (2026-09-21): patch bump — deliver accumulated template content to the fleet (equal-version content drift measured 2026-09-21; upgrade-project 1.37 UPDATE delivery).
- **1.0.1** (2026-09-21): patch bump — deliver accumulated template content that predated this version to the fleet (equal-version content drift measured 2026-09-21; upgrade-project 1.37 UPDATE delivery).
- 2026-09-04: 1.0.0 — initial version.
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC).

## Dependencies
- `scripts/sync-skills.ts` (distribution and back-sync — present in this project)
- `scripts/validate-skills.ts` (frontmatter validation — present in this project)

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-09-04 | - | production | Created and validated in same cycle (upstream) | pm |
| 2026-11-12 | production | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Active Phase
- [x] SKILL.md exists at `skills/platform-skill-lifecycle-manager/SKILL.md`
- [x] Frontmatter valid; registered in docs/VERSION_MANIFEST.md
- [x] SSOT-first distribution flow documented

## Metadata
- **Current Phase**: production
- **Version**: 1.0.2
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm

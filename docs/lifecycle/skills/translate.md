<!-- LOCAL-PATCH(upstream-request: U-20261112-011): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/translate.md) -->
# Translate Skill Lifecycle

## Metadata
- **Skill**: translate
- **Status**: active
- **Version**: 1.0.3
- **Owner**: pm
- **Created**: 2026-07-03
- **Last Updated**: 2026-11-12

## Description
Translation maintenance skill backing README translation upkeep: translation runs,
hash verification, and lifecycle auditing of translated surfaces.

## Changelog
- **1.0.2** (2026-09-21): patch bump — deliver accumulated template content that predated this version to the fleet (equal-version content drift measured 2026-09-21; upgrade-project 1.37 UPDATE delivery).
- 2026-07-03: backfilled lifecycle record for the existing production skill (upstream).
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC).

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-07-03 | - | production | Backfilled lifecycle record for existing production skill (upstream) | pm |
| 2026-11-12 | production | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] Skill SKILL.md exists at `skills/translate/SKILL.md`
- [x] Frontmatter valid: name, description, status, scope, version, owner populated
- [x] Triggers defined (translate / localization maintenance)
- [x] Successfully tested in translation operations

## Dependencies
- pm (owner agent)
- `scripts/translate-readme.ts` (translation script — present in this project)
- `scripts/verify-readme-sync.ts` (hash verification — present in this project)
- `scripts/readme-lifecycle-audit.ts` (lifecycle audit — present in this project)

## Metadata
- **Current Phase**: production
- **Version**: 1.0.3
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm

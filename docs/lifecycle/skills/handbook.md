<!-- LOCAL-PATCH(upstream-request: U-20261112-011): project-local adaptation of delivered record -->
# Handbook Skill Lifecycle

## Metadata
- **Skill**: handbook
- **Status**: active
- **Version**: 0.6.0
- **Owner**: pm
- **Created**: 2026-09-21 (record backfill — the skill predates this record; active since at least 2026-09-20 per frontmatter `last_reviewed`)
- **Last Updated**: 2026-11-12

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-09-21 | (pre-record) | production | Record backfill — active skill without a lifecycle record (upstream 2026-09-21 project review H-9) | pm |
| 2026-11-12 | production | production | Record rewritten to project-local form; dual Metadata added so skill-lifecycle-audit Check MV evaluates it (U-20261112-011) | pm |

## Acceptance Criteria

### Production Phase
- [x] Skill SKILL.md exists at `skills/handbook/SKILL.md`
- [x] Frontmatter valid: name, description, status, scope (`common`), version, owner populated
- [x] Common-layer asset delivered to this project via the variant template pipeline
- [x] Companion validation skill `handbook-sync-audit` has its own lifecycle record in this project

## Metadata
- **Current Phase**: production
- **Version**: 0.6.0
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm

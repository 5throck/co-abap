<!-- LOCAL-PATCH(upstream-request: U-20261113-003): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/documentation-writing.md) -->
# Documentation-Writing Skill — Lifecycle Record

## Metadata
- **Skill**: documentation-writing
- **Status**: active
- **Version**: 1.0.3
- **Owner**: pm
- **Created**: 2026-08-28
- **Last Updated**: 2026-11-12

## Description
Creates clear, accessible documentation and communications for diverse audiences — guides, manuals, tutorials, technical and non-technical writing.

## Changelog
- **1.0.2** (2026-09-21): patch bump — deliver accumulated template content to the fleet (equal-version content drift measured 2026-09-21; upgrade-project 1.37 UPDATE delivery).
- **1.0.1** (2026-09-21): patch bump — deliver accumulated template content that predated this version to the fleet (equal-version content drift measured 2026-09-21; upgrade-project 1.37 UPDATE delivery).
- 2026-08-28: promoted from duplicate variant-local copies into the workspace common layer (identical body deduplicated; generic, not domain-specific).
- 2026-08-29: lifecycle record created upstream (backfill — the record was missing after the promotion).
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC).

## Dependencies
- None (knowledge/process skill)

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-08-28 | - | production | Promoted from duplicate variant-local copies to the workspace common layer (upstream) | pm |
| 2026-11-12 | production | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] Skill SKILL.md exists at `skills/documentation-writing/SKILL.md`
- [x] Frontmatter valid: name, description, status, scope, version, owner populated
- [x] Skill is registered in docs/VERSION_MANIFEST.md
- [x] Scope: common

## Metadata
- **Current Phase**: production
- **Version**: 1.0.3
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm

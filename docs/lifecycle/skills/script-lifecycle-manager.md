<!-- LOCAL-PATCH(upstream-request: U-20261112-011): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/script-lifecycle-manager.md) -->
# Script-Lifecycle-Manager Skill Lifecycle

## Metadata
- **Skill**: script-lifecycle-manager
- **Status**: active
- **Version**: 1.2.2
- **Owner**: pm
- **Created**: 2026-05-29
- **Last Updated**: 2026-11-12

## Description
Script lifecycle management: creation, modification, deprecation, validation, and cross-platform compatibility checks for project scripts.

## Changelog
- **1.2.2** (2026-09-21): patch bump — deliver accumulated template content to the fleet (equal-version content drift measured 2026-09-21; upgrade-project 1.37 UPDATE delivery).
- **1.2.1** (2026-09-21): patch bump — deliver accumulated template content that predated this version to the fleet (equal-version content drift measured 2026-09-21; upgrade-project 1.37 UPDATE delivery).
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC).

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-05-29 | - | production | Initial skill established for script lifecycle management (upstream) | lifecycle-manager |
| 2026-09-12 | production | production | Owner corrected automation-engineer → pm to match SKILL.md frontmatter (T-20260912-010, upstream) | pm |
| 2026-11-12 | production | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] Skill purpose clearly defined: Script lifecycle management
- [x] Trigger conditions: When scripts are created, modified, or deprecated
- [x] Examples provided: Script validation, cross-platform compatibility checks
- [x] Successfully tested in script management operations

## Dependencies
- pm (owner agent)
- lifecycle-manager procedures (governance reference)

## Metadata
- **Current Phase**: production
- **Version**: 1.2.2
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm

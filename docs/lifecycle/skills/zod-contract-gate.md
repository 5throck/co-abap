<!-- LOCAL-PATCH(upstream-request: U-20261112-011): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/zod-contract-gate.md) -->
# Zod-Contract-Gate Skill — Lifecycle Record

## Metadata
- **Skill**: zod-contract-gate
- **Status**: active
- **Version**: 1.0.2
- **Owner**: architect
- **Created**: 2026-08-16
- **Last Updated**: 2026-11-12

## Description
Defines Zod runtime schema validation patterns, interface boundaries, and contract safety rules for multi-agent architecture, IPC channels, and API endpoints.

## Changelog
- **1.0.2** (2026-09-21): patch bump — deliver accumulated template content to the fleet (equal-version content drift measured 2026-09-21; upgrade-project 1.37 UPDATE delivery).
- **1.0.1** (2026-09-21): patch bump — deliver accumulated template content that predated this version to the fleet (equal-version content drift measured 2026-09-21; upgrade-project 1.37 UPDATE delivery).
- 2026-08-16: lifecycle record created from SKILL.md frontmatter (upstream backfill).
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC).

## Dependencies
- Bun runtime
- Zod library (^3.25 || ^4.0)

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-08-16 | - | production | Backfilled lifecycle document from existing SKILL.md (upstream) | lifecycle-manager |
| 2026-11-12 | production | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] Skill SKILL.md exists at `skills/zod-contract-gate/SKILL.md`
- [x] Frontmatter valid: name, description, status, scope, version, owner populated
- [x] Skill is registered in docs/VERSION_MANIFEST.md
- [x] Scope: common

## Notes
- Owner: architect

## Metadata
- **Current Phase**: production
- **Version**: 1.0.2
- **Owner**: architect
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm

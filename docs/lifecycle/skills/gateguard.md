<!-- LOCAL-PATCH(upstream-request: U-20261112-011): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/gateguard.md) -->
# Gateguard Skill — Lifecycle Record

## Metadata
- **Skill**: gateguard
- **Status**: active
- **Version**: 1.0.2
- **Owner**: pm
- **Created**: 2026-08-16
- **Last Updated**: 2026-11-12

## Description
Pre-edit fact-forcing quality gate. Ensures agents investigate a file's importers, schemas, and scope constraints before making changes. Part of the 3-layer enforcement model (Hook -> Prompt -> Skill).

## Changelog
- **1.0.2** (2026-09-21): patch bump — deliver accumulated template content to the fleet (equal-version content drift measured 2026-09-21; upgrade-project 1.37 UPDATE delivery).
- **1.0.1** (2026-09-21): patch bump — deliver accumulated template content that predated this version to the fleet (equal-version content drift measured 2026-09-21; upgrade-project 1.37 UPDATE delivery).
- 2026-08-16: lifecycle record created from SKILL.md frontmatter (upstream backfill).
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC).

## Dependencies
- Bun runtime
- `scripts/hooks/gateguard-fact-force.ts` — Hook layer implementation (present in this project)

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-08-16 | - | production | Backfilled lifecycle document from existing SKILL.md (upstream) | lifecycle-manager |
| 2026-11-12 | production | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] Skill SKILL.md exists at `skills/gateguard/SKILL.md`
- [x] Frontmatter valid: name, description, status, scope, version, owner populated
- [x] Skill is registered in docs/VERSION_MANIFEST.md
- [x] Scope: common

## Notes
- Owner: pm
- Upstream governance origin: specified in the workspace-root CONSTITUTION.md section 11.2 (not present in this project)

## Metadata
- **Current Phase**: production
- **Version**: 1.0.2
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm

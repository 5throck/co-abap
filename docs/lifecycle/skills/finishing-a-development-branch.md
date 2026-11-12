<!-- LOCAL-PATCH(upstream-request: U-20261113-003): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/finishing-a-development-branch.md) -->
# Finishing-a-Development-Branch Skill — Lifecycle Record

## Metadata
- **Skill**: finishing-a-development-branch
- **Status**: active
- **Version**: 1.0.1
- **Owner**: pm
- **Created**: 2026-09-04
- **Last Updated**: 2026-11-12

## Description
Guides clean completion of a development branch: verify tests/audits, update
docs, merge or open a PR, and clean up local/remote branches. Adapted from the
Superpowers finishing-a-development-branch workflow for this workspace's
PR-based flow.

## Changelog
- **1.0.1** (2026-09-21): patch bump — deliver accumulated template content that predated this version to the fleet (equal-version content drift measured 2026-09-21; upgrade-project 1.37 UPDATE delivery).
- 2026-09-04: 1.0.0 — initial import and workspace adaptation.
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC). Upstream note: the workspace-root seed also carried a 1.0.2 fleet-delivery entry; this project's delivered SKILL.md is v1.0.1, so the record is normalized to the frontmatter version.

## Dependencies
- Composes with `sync` (PR pipeline)
- Relates to `finishing-a-development-branch` conventions from superpowers

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-09-04 | - | production | Imported pre-validated from superpowers; registered in VERSION_MANIFEST (upstream) | pm |
| 2026-11-12 | production | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] SKILL.md exists at `skills/finishing-a-development-branch/SKILL.md`
- [x] Frontmatter valid; registered in docs/VERSION_MANIFEST.md
- [x] Workflow matches the PR-based branch flow used in this project

## Metadata
- **Current Phase**: production
- **Version**: 1.0.1
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm

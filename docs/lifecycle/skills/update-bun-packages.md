<!-- LOCAL-PATCH(upstream-request: U-20261113-003): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/update-bun-packages.md) -->
# Update-Bun-Packages Skill — Lifecycle Record

## Metadata
- **Skill**: update-bun-packages
- **Status**: active
- **Version**: 1.3.1
- **Owner**: pm
- **Created**: 2026-08-16
- **Last Updated**: 2026-11-12

## Description
Scans, updates, and upgrades Bun dependencies and packages in the project while ensuring lockfile consistency, package.json version bumps, and security compliance.

## Changelog
- 2026-09-09: Version 1.3.1 — documented the template package alignment path (`--apply`) as the required root/common/variant alignment step (upstream).
- 2026-08-16: lifecycle record created from SKILL.md frontmatter (upstream backfill).
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC).

## Dependencies
- Bun runtime

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-08-16 | - | production | Backfilled lifecycle document from existing SKILL.md (upstream) | lifecycle-manager |
| 2026-11-12 | production | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] Skill SKILL.md exists at `skills/update-bun-packages/SKILL.md`
- [x] Frontmatter valid: name, description, status, scope, version, owner populated
- [x] Skill is registered in docs/VERSION_MANIFEST.md
- [x] Scope: common

## Metadata
- **Current Phase**: production
- **Version**: 1.3.1
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm

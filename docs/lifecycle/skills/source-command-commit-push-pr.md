<!-- LOCAL-PATCH(upstream-request: U-20261113-003): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/source-command-commit-push-pr.md) -->
# Source-Command-Commit-Push-PR Skill — Lifecycle Record

## Metadata
- **Skill**: source-command-commit-push-pr
- **Status**: active
- **Version**: 1.0.3
- **Owner**: pm
- **Created**: 2026-09-04
- **Last Updated**: 2026-11-12

## Description
Shortcut skill for `/commit-push-pr` registered in `.agents/skills/` and
back-synced to `.claude/skills/` and `.gemini/skills/`: stages workspace
changes, writes an English conventional commit message, pushes the branch, and
opens a PR — the lightweight alternative to the full `sync` pipeline.

## Changelog
- **1.0.3** (2026-09-21): patch bump — deliver accumulated template content to the fleet (equal-version content drift measured 2026-09-21; upgrade-project 1.37 UPDATE delivery).
- **1.0.2** (2026-09-21): patch bump — deliver accumulated template content that predated this version to the fleet (equal-version content drift measured 2026-09-21; upgrade-project 1.37 UPDATE delivery).
- 2026-09-04: 1.0.1 — patch adjustment at lifecycle-record creation (upstream).
- 2026-09-04: 1.0.0 — initial version (upstream).
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC).

## Dependencies
- Composes with (lighter than) `sync`
- Back-synced via `scripts/sync-skills.ts` (present in this project)

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-09-04 | - | production | Created and validated in same cycle (upstream) | pm |
| 2026-11-12 | production | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Active Phase
- [x] SKILL.md exists at `skills/source-command-commit-push-pr/SKILL.md`
- [x] Frontmatter valid; registered in docs/VERSION_MANIFEST.md
- [x] Platform mirrors (.agents/, .claude/, .gemini/) carry the skill

## Metadata
- **Current Phase**: production
- **Version**: 1.0.3
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm

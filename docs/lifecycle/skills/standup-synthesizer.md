<!-- LOCAL-PATCH(upstream-request: U-20261112-011): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/standup-synthesizer.md) -->
# Standup-Synthesizer Skill — Lifecycle Record

## Metadata
- **Skill**: standup-synthesizer
- **Status**: active
- **Version**: 1.1.0
- **Owner**: pm
- **Created**: 2026-08-16
- **Last Updated**: 2026-11-12

## Description
Automated daily standup digest synthesizer aggregating git commit logs, issue status updates, pull request reviews, and ticket queue events over a 24-hour window.

## Changelog
- 2026-11-06: Version 1.1.0 aligned with the root and common SKILL.md after the CI warning cleanup skill merge (DEC-20261106-03, upstream).
- 2026-08-16: lifecycle record created from SKILL.md frontmatter (upstream backfill).
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC).

## Dependencies
- Bun runtime
- git

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-08-16 | - | production | Backfilled lifecycle document from existing SKILL.md (upstream) | lifecycle-manager |
| 2026-11-12 | production | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] Skill SKILL.md exists at `skills/standup-synthesizer/SKILL.md`
- [x] Frontmatter valid: name, description, status, scope, version, owner populated
- [x] Skill is registered in docs/VERSION_MANIFEST.md
- [x] Scope: common

## Metadata
- **Current Phase**: production
- **Version**: 1.1.0
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm

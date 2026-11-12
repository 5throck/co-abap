# Desktop-App-Fallback Skill — Lifecycle Record

## Metadata
- **Skill**: desktop-app-fallback
- **Status**: active
- **Version**: 1.0.1
- **Owner**: test-runner
- **Created**: 2026-05-24 (first commit adding `skills/desktop-app-fallback/` in this checkout)
- **Last Updated**: 2026-11-12

## Description
Manual Post-Write QA chain for the Claude Code Desktop App, where hooks do not
fire: the mandatory post-write quality gates are run by hand in the documented
order when working in that environment.

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-05-24 | - | production | Authored 2026-05-24 (first commit adding the skill path); delivered with the variant template | pm |
| 2026-11-12 | production | production | Lifecycle record backfill — active skill without a record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] SKILL.md exists at `skills/desktop-app-fallback/SKILL.md`
- [x] Frontmatter valid: name, description, status, version, owner (test-runner) populated
- [x] Manual QA chain documented step by step with expected results
- [x] Scope limited to environments where hooks do not fire (Desktop App fallback)

## Metadata
- **Current Phase**: production
- **Version**: 1.0.1
- **Owner**: test-runner
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm

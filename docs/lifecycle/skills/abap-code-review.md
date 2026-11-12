# Abap-Code-Review Skill — Lifecycle Record

## Metadata
- **Skill**: abap-code-review
- **Status**: active
- **Version**: 1.0.2
- **Owner**: code-writer
- **Created**: 2026-08-28 (first commit adding `skills/abap-code-review/` in this checkout)
- **Last Updated**: 2026-11-12

## Description
ABAP-specific source review before object activation, transport release, or after
importing foreign code: naming conventions, pretty-printer formatting, and
anti-pattern compliance, checked against `docs/standards/clean-abap-checklist.md`
(the three ABAP-specific dimensions general-purpose review skills do not cover).

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-08-28 | - | production | Authored 2026-08-28 (first commit adding the skill path); delivered with the variant template | pm |
| 2026-11-12 | production | production | Lifecycle record backfill — active skill without a record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] SKILL.md exists at `skills/abap-code-review/SKILL.md`
- [x] Frontmatter valid: name, description, status, version, owner (code-writer) populated
- [x] Review dimensions cover naming conventions, pretty-printer formatting, and anti-pattern compliance
- [x] Checklist reference resolves in-checkout (`docs/standards/clean-abap-checklist.md` exists)

## Metadata
- **Current Phase**: production
- **Version**: 1.0.2
- **Owner**: code-writer
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm

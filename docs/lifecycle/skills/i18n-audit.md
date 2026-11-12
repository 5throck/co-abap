<!-- LOCAL-PATCH(upstream-request: U-20261113-003): project-local adaptation of delivered record -->
# I18N Audit Skill Lifecycle

## Metadata
- **Skill**: i18n-audit
- **Status**: active
- **Version**: 1.0.0
- **Owner**: pm
- **Created**: 2026-08-29
- **Last Updated**: 2026-11-12

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-08-29 | - | production | Common `i18n-audit` skill created (generalized from a variant specialization) as part of the I18N audit consolidation (upstream `reledgev` design) | pm |
| 2026-11-12 | production | production | Record rewritten to project-local form; dual Metadata added so skill-lifecycle-audit Check MV evaluates it (U-20261113-003) | pm |

## Acceptance Criteria

### Production Phase
- [x] Skill SKILL.md exists at `skills/i18n-audit/SKILL.md`
- [x] Frontmatter valid: name, description, status, scope, version, owner populated
- [x] Triggers defined: i18n audit, locale parity, translation parity, glossary audit, L10N parity
- [x] Member of the i18n suite dispatched by the `i18n-specialist` agent (present in this project's roster)

## Metadata
- **Current Phase**: production
- **Version**: 1.0.0
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm

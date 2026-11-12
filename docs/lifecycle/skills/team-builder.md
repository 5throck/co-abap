<!-- LOCAL-PATCH(upstream-request: U-20261113-003): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/team-builder.md) -->
# Team-Builder Skill Lifecycle

## Metadata
- **Skill**: team-builder
- **Status**: active
- **Version**: 1.2.0
- **Owner**: pm
- **Created**: 2026-07-03
- **Last Updated**: 2026-11-12

## Description
Builds new agent teams: assembles agent rosters from user requirements and
generates agent definition files, with proposal JSON schema in the scalar tier
form (`"tier": "high|medium|low"`).

## Changelog
- 2026-10-26: v1.1.0 → v1.2.0 (ADR-0102 / T-20261026-018, upstream design `2026-10-26-model-registry-platform-coverage-design.md` §7): proposal JSON schema documented with the scalar tier form (the legacy per-platform map stays accepted by `scripts/team-builder.ts` v1.5.0 during transition); frontmatter last_reviewed refreshed.
- 2026-07-03: backfilled lifecycle record for the existing production skill (upstream).
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC).

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-07-03 | - | production | Backfilled lifecycle record for existing production skill (upstream) | pm |
| 2026-10-26 | production | production | v1.1.0 → v1.2.0 scalar-tier schema work (upstream) | pm |
| 2026-11-12 | production | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] Skill SKILL.md exists at `skills/team-builder/SKILL.md`
- [x] Frontmatter valid: name, description, status, scope, version, owner populated
- [x] Triggers defined: build new agent team
- [x] Successfully tested in team building operations

## Dependencies
- pm (owner agent)
- `scripts/team-builder.ts` (script layer execution — present in this project)
- agent-lifecycle-manager (individual agent lifecycle operations)
- skill-lifecycle-manager (individual skill lifecycle operations)

## Metadata
- **Current Phase**: production
- **Version**: 1.2.0
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm

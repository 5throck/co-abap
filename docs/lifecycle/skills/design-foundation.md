<!-- LOCAL-PATCH(upstream-request: U-20261113-003): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/design-foundation.md) -->
# Design-Foundation Skill — Lifecycle Record

## Metadata
- **Skill**: design-foundation
- **Status**: active
- **Version**: 1.1.0
- **Owner**: architect
- **Created**: 2026-08-30
- **Last Updated**: 2026-11-12

## Description
Style-neutral procedure for deriving a project's own design system: domain evidence → design
principles → recorded design decisions (`design_decisions` YAML in the project's `docs/design.md`)
→ 3-layer token architecture (Primitive → Semantic ← `[data-theme]` mapping → Component) →
validation contract. Extracted from the proven methods of upstream reference projects
(co-price Onyx 2.0, co-newbiz Onyx 3.0) without prescribing their styles.

## Changelog
- 2026-08-30: 1.0.0 — created (upstream spec: workspace-root `docs/designs/2026-08-30-design-foundation-design.md`)
- 2026-09-26: 1.1.0 — component inventory scaffold (`components.template.md`), inert icon
  tokens + icon vocabulary requirement, font fallback token contract, pattern field
  contract, §8 pointer genericization (upstream spec: workspace-root `docs/designs/2026-09-26-design-foundation-v1.2-design.md`)
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC).

## Dependencies
- None (procedural skill); composes with `token-usage-lint` and `accessibility-audit`; enables
  `ui-ux-design-intelligence`

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-08-30 | - | active | Initial release with Design Foundation framework (upstream) | pm |
| 2026-09-26 | 1.0.0 | 1.1.0 | v1.2 spec wave — coverage gaps closed (upstream) | PM (user-approved execution plan) |
| 2026-11-12 | active | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] SKILL.md exists at `skills/design-foundation/SKILL.md`
- [x] Frontmatter valid: name, description, status, scope, version, owner populated
- [x] Skill is registered in skills/SKILLS.md and docs/VERSION_MANIFEST.md
- [x] Triggers avoid `ui-ux-design-intelligence` overlap ("design system" excluded)

## Notes
- Owner: architect
- Follow-up backlog (upstream): automated design-lint implementation; token flat → 3-layer migration

## Metadata
- **Current Phase**: production
- **Version**: 1.1.0
- **Owner**: architect
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm

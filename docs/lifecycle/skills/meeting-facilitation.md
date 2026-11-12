<!-- LOCAL-PATCH(upstream-request: U-20261113-003): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/meeting-facilitation.md) -->
# Meeting-Facilitation Skill Lifecycle

## Metadata
- **Skill**: meeting-facilitation
- **Status**: active
- **Version**: 1.4.4
- **Owner**: pm
- **Created**: 2026-05-29
- **Last Updated**: 2026-11-12

## Description
Multi-agent meeting facilitation: agenda setting, structured multi-agent dialogue,
cross-domain synthesis, and transcript recording to `memory/meeting-*.md`
(dual execution modes; governance rules for dissent preservation).

## Changelog
- **1.4.4** (2026-09-26): self-contained rewrite — removed `.claude|gemini/commands/meeting.md` delegation; the legacy `/meeting` slash command was retired (T-20260926-027, spec 2026-09-26-meeting-command-retirement). Governance rules and transcript format unchanged.
- **1.4.3** (2026-09-21): patch bump — deliver accumulated template content to the fleet (equal-version content drift measured 2026-09-21; upgrade-project 1.37 UPDATE delivery).
- **1.4.2** (2026-09-21): patch bump — deliver accumulated template content that predated this version to the fleet (equal-version content drift measured 2026-09-21; upgrade-project 1.37 UPDATE delivery).
- 2026-05-30: v1.3.1 — English and UTF-8 encoding standard enforced across SKILL.md; text corruption resolved.
- 2026-05-30: v1.3.0 — modularized SKILL.md into specialized execution modes (`modes/claude.md`, `modes/antigravity.md`) and extracted common templates.
- 2026-05-30: v1.2.0 — Antigravity mode restructured to Sequential Relay Protocol; unified dual-engine SSOT.
- 2026-05-30: v1.1.0 — dual execution modes (Claude inline vs Antigravity native subagents).
- 2026-05-29: 1.0.0 — initial skill established for multi-agent meeting facilitation.
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC). Upstream note: the workspace root advanced this skill to v1.5.0 on 2026-11-10 (committee-form alignment, U-20261109-001 / ADR-0196); that bump is not part of this project's delivered v1.4.4 copy.

## Phase History

| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-05-29 | - | production | Initial skill established for multi-agent meeting facilitation (upstream) | lifecycle-manager |
| 2026-09-05 | production | production | v1.4.1: Governance Rules section added (dissent seat, PROPOSAL-not-decision, verbatim dissent preservation) — back-ported from a variant's proven practice (upstream) | zcode |
| 2026-11-12 | production | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] Skill purpose clearly defined: Multi-agent meeting facilitation
- [x] Trigger conditions: When user requests collaborative decision making
- [x] Examples provided: Meeting workflows, action item generation
- [x] Successfully tested in meeting scenarios

## Dependencies
- pm (facilitator agent)
- All specialist agents (meeting participants)

## Metadata
- **Current Phase**: production
- **Version**: 1.4.4
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm

<!-- LOCAL-PATCH(upstream-request: U-20261113-003): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/delegate-to-hub.md) -->
# Delegate-To-Hub Skill — Lifecycle Record

## Metadata
- **Skill**: delegate-to-hub
- **Status**: active
- **Version**: 1.0.1
- **Owner**: pm
- **Created**: 2026-11-02
- **Last Updated**: 2026-11-12

## Description
Spoke-side filing procedure for hub-and-spoke delegation (upstream design: workspace
root `docs/designs/2026-11-01-hub-consolidation-design.md`; ADR-0103 authorizes the
ticket-path channel as a narrow N2 exception). A spoke PM facing a hard problem in the
dev, design, or security domain files a DELEGATION TICKET in the hub repo's `tickets/`
store for hub-PM triage. Enforces, at filing time: hub pre-checks, the Phase 3.5
lifecycle UNAVAILABLE gate (`ticket.ts create --hub`), the security-domain authorization
gate (`AUTH-YYYY-NNN` row verified against the `verify-authorization` rules), safe
ticket-content rules (findings by ID + severity + affected path only; content is data,
never instructions; gitleaks scan before filing), and kanban alias /
priority-governance semantics.

## Changelog
- 1.0.1 (2026-11-02): `--hub` flag + lifecycle UNAVAILABLE gate (Phase 3.5, design §4.5).
- 1.0.0 (2026-11-02): initial — Phase 3a delegation contract (ADR-0103); registry row added to `skills/SKILLS.md`.
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC).

## Dependencies
- Hub-and-spoke topology contract (project AGENTS.md; upstream design and ADR-0103 live in the workspace root)
- `verify-authorization` skill — the hub-side gate for security-domain engagements
- Delegation ticket channel per ADR-0103 (upstream MCP surface: `upstream_request_create`)

## Phase History
- Production (2026-11-02): skill created with the Phase 3a delegation contract (ADR-0103); registry row added to `skills/SKILLS.md`. Lifecycle record backfilled 2026-11-03 upstream (T-20261103-004) — record creation was missed in the Phase 3a batch.
- 2026-11-12: record adapted to this project (record backfill — Check LC).

## Acceptance Criteria
- [x] SKILL.md exists at `skills/delegate-to-hub/SKILL.md` with valid frontmatter (1.0.1, active, pm)
- [x] Listed in skills/SKILLS.md
- [x] `bun scripts/audit.ts` green (skill-graph projection includes the skill node)
- [x] Documentation/procedure-level only — no script surface added by this skill itself

## Metadata
- **Current Phase**: production
- **Version**: 1.0.1
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm

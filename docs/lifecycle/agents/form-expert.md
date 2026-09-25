# Lifecycle — form-expert

Lifecycle tracking for the `form-expert` agent (co-abap variant).

| Field | Value |
|-------|-------|
| Agent file | [`agents/form-expert.md`](../../../agents/form-expert.md) |
| Lifecycle states | draft / production (active) / deprecated / retired |

> The authoritative lifecycle state lives in the agent file's `lifecycle:` frontmatter block
> (`phase`, `created`, `last_updated`). Audit coverage:
> `bun scripts/agent-lifecycle-audit.ts`.

## Phase History

| Date | Event | Notes |
|------|-------|-------|
| — | created | See agent file frontmatter `lifecycle.created` |

## Acceptance Criteria

- Agent file passes `bun scripts/agent-lifecycle-audit.ts` (frontmatter completeness, tier block, examples)
- Agent file passes `bun scripts/validate-agents.ts` runtime-definition checks
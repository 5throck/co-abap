# Lifecycle — pp-analyst

Lifecycle tracking for the `pp-analyst` agent (co-abap variant).

| Field | Value |
|-------|-------|
| Agent file | [`agents/pp-analyst.md`](../../../agents/pp-analyst.md) |
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
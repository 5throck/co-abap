# Parallel Dispatch Template

Use this template when dispatching multiple read-only subagents simultaneously.

## When to Use

- Read-only research (codebase scan, schema inspection, business data queries)
- Independent analysis tasks that don't share state
- Phase 1 triage and investigation

## Template

```
Agent(
  description = "Brief description of subagent 1",
  model = "haiku", // Use short alias: opus, sonnet, or haiku
  prompt = """You are a [role]. Your task is to [specific task].

Context: [relevant context, file paths, expectations]

Output format: [expected output format]
"""
)

Agent(
  description = "Brief description of subagent 2",
  model = "haiku", // Use short alias: opus, sonnet, or haiku
  prompt = """You are a [role]. Your task is to [specific task].

Context: [relevant context, file paths, expectations]

Output format: [expected output format]
"""
)
```

## Important

- Dispatch all parallel agents in a single message (multiple tool calls)
- Wait for ALL to return before proceeding
- Merge results before next step

## CLI Fan-Out (`dispatch-parallel.ts`)

When the native `Agent` tool is not available (or you want separate CLI processes), run:

```bash
bun scripts/dispatch-parallel.ts --platform <claude|codex|gemini|antigravity-cli|hermes> --plan <plan-file> [--dry-run]
```

- **Plan rows** carry `mode: read|write` (read is the default). Write rows must declare `sapScope {packages, objects, actions, maxClass}`; each child gets its own proxy (`--dispatch-child`) limited to that scope, and write rows run in git worktrees.
- **Grant flow** for write rows: the dispatcher writes a grant request and stops. A human runs `bun scripts/sap-approve.ts --grant <runId>` in their own terminal, then re-run with `--run-id <runId>`, or start with `--wait-grant <minutes>`. `--grant-window <minutes>` sets how long the grant lasts (default 60). The grant ends with the run. Agents must never grant.
- **Other flags**: `--max-parallel <n>` (default 4), `--timeout <seconds>` (default 600), `--kill-grace <seconds>` (default 10), `--out-dir <dir>` (must be under `memory/dispatch`), `--dry-run`.
- **Hermes**: rows are refused unless `--allow-hermes-write` is passed, because no read-only mode or per-invocation MCP override is verified.
- Child SAP calls still pass through `scripts/sap-mcp-proxy.ts`. See [setup-guide 5-F](setup-guide.md#5-f-sap-mcp-proxy-and-approvals).

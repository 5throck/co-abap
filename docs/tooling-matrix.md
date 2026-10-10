# Tooling Matrix

Cross-tool capability reference for the vsp/SAP ABAP Harness Engineering project.

> For agent roles and orchestration, see [AGENTS.md](../AGENTS.md).
> For shared engineering rules, see [context.md](context.md).
> For the parity design behind this matrix, see [Cross-platform parity design](designs/2026-10-10-cross-platform-parity-design.md).
> For tool-specific setup, see [CLAUDE.md](../CLAUDE.md), [CODEX.md](../CODEX.md), [GEMINI.md](../GEMINI.md), and [HERMES.md](../HERMES.md).

---

## SAP Safety Is Platform-Independent

Every platform launches the `abap` MCP server through `scripts/sap-mcp-proxy.ts`. The proxy is the single enforcement point: it classifies each call (allow / ask / deny), records audit lines and QA evidence, and gates transport release. An `ask` returns `APPROVAL_REQUIRED id=<id>`; a human runs `bun scripts/sap-approve.ts <id>` in their own terminal (agents never run it). Hooks are optional UX on every platform. The former manual profile is retired.

## 8-Platform Matrix

| Platform | `abap` MCP config (via proxy) | Native parallel dispatch | Fallback fan-out | Commands | Skills mirror | Hooks (UX only) | On-device check |
|----------|-------------------------------|--------------------------|------------------|----------|---------------|-----------------|-----------------|
| Claude Code CLI | `.mcp.json` | `Agent` tool | `dispatch-parallel.ts --platform claude` | `.claude/commands/*.md` | `.claude/skills/` | PreToolUse/PostToolUse (non-SAP) | — |
| Claude Code Desktop App | `.mcp.json` | `Agent` tool | `dispatch-parallel.ts --platform claude` | `.claude/commands/*.md` | `.claude/skills/` | via bundled CLI | V10 |
| Codex CLI | `.codex/config.toml` | `multi_agent` (if usable) | `dispatch-parallel.ts --platform codex` | `.codex/prompts/*.md` | `.codex/skills/` | `.codex/hooks.json` | V1–V4 |
| Codex IDE | `.codex/config.toml` | `multi_agent` (if usable) | `dispatch-parallel.ts --platform codex` | `.codex/prompts/*.md` | `.codex/skills/` | `.codex/hooks.json` | V3 |
| Gemini CLI | `.gemini/settings.json` | `.gemini/agents/*.md` via `@name` | `dispatch-parallel.ts --platform gemini` | `.gemini/commands/*.toml` | `.gemini/skills/` | BeforeTool/AfterTool | V5, V6 |
| Antigravity IDE | `.agents/mcp.json` | Agent Manager | — | emulated | `.agents/skills/` | none | V9 |
| Antigravity CLI | pending V8 | pending V8 | `dispatch-parallel.ts --platform antigravity-cli` | pending V8 | `.agents/skills/` | pending V8 | V8 |
| Hermes Agent | `~/.hermes/config.yaml` (user-level; template `config/platforms/hermes-mcp.example.yaml`) | `delegate_task` | `dispatch-parallel.ts --platform hermes` | skills as `/<name>` | `.hermes/skills/` | `pre_tool_call` | V7 |

Commands have one source, `config/commands/*.md`, rendered by `bun scripts/render-commands.ts`. Parity is checked by `bun scripts/validate-platform-parity.ts`.

## Post-Write Chain

The chain (syntax check → unit tests → coverage → ATC; `SAP(action=analyze, type=syntax_check)`, `SAP(action=test)`) is required on every platform. The proxy records its evidence wherever it runs; use `/post-write <object>` when nothing triggers it automatically. See [Post-Write Chain](../skills/post-write-chain/SKILL.md).

## Tool Selection Rule

**Default rule**: Use Claude Code CLI or App for orchestration. Use Desktop App for visual diff review, PR monitoring, and parallel sessions. Use Antigravity for file-centric editing. Use Gemini CLI when web research is needed. Codex and Hermes are full peers for SAP work because safety lives in the proxy. Linux: the Claude Desktop App is not available.

---

*Last Updated: 2026-10-10 — 8-platform matrix; SAP safety via proxy (parity design Phase 5)*

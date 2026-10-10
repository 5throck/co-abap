# ADR-0005: Cross-Platform Parity With a Single SAP Enforcement Point

- **Status:** Accepted
- **Date:** 2026-10-10
- **Decider:** PM (user decisions of 2026-10-10)
- **Related design:** [Cross-Platform Parity Design](../designs/2026-10-10-cross-platform-parity-design.md)

## Context

The harness must behave identically on every supported AI tool: same SAP allow/deny, same audit and evidence, same commands, same commit pipeline.

## Decision (D1-D7 of the design)

1. Eight platforms are mandatory in the parity smoke: Claude Code CLI, Claude Desktop, Codex CLI, Codex IDE, Gemini CLI, Antigravity IDE, Antigravity CLI, Hermes Agent. There is no best-effort tier.
2. D1: `scripts/sap-mcp-proxy.ts` is the single SAP enforcement point. Claude SAP hooks are advisory only.
3. D2: "ask" means deny plus a human-run one-time approval (`bun scripts/sap-approve.ts <id>`) on every platform.
4. D3: the manual profile is retired.
5. D4: parallel dispatch uses each tool's native mechanism; platforms without one use `scripts/dispatch-parallel.ts`. Sequential role-play is not an accepted fallback.
6. D5-D7: Antigravity CLI and Hermes Agent are first-class platforms.
7. Commands are single-sourced in `config/commands` and rendered per platform (Gemini needs TOML).
8. Platform deny rules are single-sourced in `config/platforms/protected-paths.json` and checked by `validate-platform-parity.ts deny-rules`. Codex, Gemini, Hermes and Antigravity settings are unverified on-device (checks V1-V10 pending, Phase 6).

## Consequences

One enforcement path to audit. On-device verification is outstanding. See [ADR-0006](0006-sap-approval-security-model.md) and [ADR-0007](0007-parallel-dispatch-grants.md).

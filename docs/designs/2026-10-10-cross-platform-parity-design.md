# Cross-Platform Parity — identical harness behavior on Claude Code, Codex, Gemini CLI, Antigravity

- **Spec ID**: 2026-10-10-cross-platform-parity
- **Date**: 2026-10-10
- **Status**: approved (2026-10-10, user decisions in §0)
- **Author**: architect
- **Builds on**: [2026-10-10-sap-write-safety-gate-design.md](2026-10-10-sap-write-safety-gate-design.md) (PR #194, unmerged)
- **Scope**: `.mcp.json`, `.codex/config.toml`, `.codex/hooks.json`, `.gemini/settings.json`, `.agents/mcp.json`, `.gemini/commands/`, `.codex/prompts/`, `scripts/hooks/sap-action-*.ts`, `scripts/lib/sap-action-lib.ts`, `config/sap-action-policy.json`, new `scripts/sap-mcp-proxy.ts`, new parity validator, CLAUDE/CODEX/GEMINI/HERMES.md

## 0. Decisions (2026-10-10)

| # | Decision | Effect on this design |
|---|---|---|
| D1 | The MCP proxy (`scripts/sap-mcp-proxy.ts`) is the **single SAP enforcement point**. Claude Code SAP hooks stay **advisory only** (they warn, never decide). | Option C adopted; Claude PreToolUse gate demoted to advisory in Phase 2; PostToolUse SAP audit removed (proxy writes audit/evidence). |
| D2 | "Ask" = **deny + human-run one-time approval** via `bun scripts/sap-approve.ts <id>` on **every** platform, Claude included. | Option B1 adopted; no in-chat ask path remains for SAP actions. |
| D3 | The **manual profile is retired**. | `release.blockInManualProfile` and profile switching removed; `profileOf()` kept one release as deprecated alias returning a constant. |
| D4 | Parallel dispatch uses **each tool's own parallel mechanism**; platforms verified to lack native subagents (Codex, and Hermes only if Phase 0 confirms) use parallel OS processes via `scripts/dispatch-parallel.ts`. **Sequential role-play is no longer an accepted fallback.** | §5.1 rewritten; dispatcher changes added to Phase 4. |
| D6 | **Antigravity CLI** is a separate platform from the Antigravity IDE, with the same proxy enforcement, commands, skills and native parallel dispatch, and mandatory in smoke. Package/command name, config location and MCP/hook/subagent capabilities are to verify (Phase 0). | Added to §2, §3, §5.1, phases and smoke. |
| D5 | **All platforms are mandatory** in the parity smoke checklist: Claude Code CLI, Claude Desktop, Codex CLI, Codex IDE, Gemini CLI, Antigravity IDE, Antigravity CLI (D6), Hermes Agent (D7). No best-effort tier. | §6 smoke checklist; Phase 2/6 exit criteria require all six. |
| D7 | **Hermes Agent** is a first-class, mandatory platform (`HERMES.md`, `.hermes/skills/` with 49 entries exist). Same proxy enforcement, commands, skills, native parallel dispatch (or `dispatch-parallel.ts` processes only if verified to have none), tier mapping, smoke. Unknown capabilities are to verify (Phase 0). | Own column/row in §2, §3, §5.1, phases, smoke. |

## 1. Requirement

User (2026-10-10): the harness must support Anthropic (Claude Code CLI/Desktop), OpenAI (Codex CLI/IDE) and Google (Gemini CLI, Antigravity) tools, **and they must behave the same**. "Same" is interpreted as: the same SAP actions are allowed/denied with the same messages, the same audit/evidence is written, the same commands/skills exist, and the same commit pipeline applies.

## 2. Parity inventory (verified in repo, PR #194 branch)

Legend: ✅ supported · 🟡 partial · ❌ missing · ❓ to verify

| Capability | Claude Code CLI | Claude Desktop | Codex CLI/IDE | Gemini CLI | Antigravity IDE | Antigravity CLI | Hermes Agent | Evidence |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---|
| Instruction file | ✅ | ✅ | ✅ | ✅ | 🟡 shares GEMINI.md | ❓ to verify (Phase 0) | ✅ `HERMES.md` | `CLAUDE.md`, `CODEX.md`, `GEMINI.md` (§ Antigravity note l.155), `HERMES.md`, SSOT `AGENTS.md` |
| abap MCP server (`./vsp`, same env) | ✅ | ✅ | ✅ | ✅ | ❓ | ❓ to verify (Phase 0) | ❓ to verify (Phase 0) | `.mcp.json`, `.codex/config.toml [mcp_servers.abap]`, `.gemini/settings.json`; `.agents/mcp.json` has **only graft** |
| Docs MCP (abap-docs, sap-docs) | ✅ | ✅ | ✅ | ✅ | ❌ | ❓ to verify (Phase 0) | ❓ to verify (Phase 0) | `.agents/mcp.json` lacks them |
| graft MCP args consistent | ✅ `graft mcp` | ✅ | 🟡 `bunx @nanonets/graft mcp` | 🟡 `graft mcp @nanonets/graft` | ✅ | ❓ to verify (Phase 0) | ❓ to verify (Phase 0) | three different invocations |
| Skills mirror | ✅ `.claude/skills` | ✅ | ✅ `.codex/skills` + `skills.config` | ✅ `.gemini/skills` | ✅ `.agents/skills` | ❓ to verify (Phase 0) | ✅ `.hermes/skills` (dir scan, no manifest — HERMES.md l.20) | dirs present |
| Slash commands (20) | ✅ 20 | ✅ 20 | ✅ 20 `.codex/prompts` | 🟡 **9** | ❌ (skills only) | ❓ to verify (Phase 0) | ❓ to verify (Phase 0) | `.gemini/commands` lacks abap-dev, post-write, transport, triage, sap-co/fi/le/mm/pp/sd, celebrate |
| SAP write gate (pre-call block/ask) | ✅ | ✅* | ❌ | ❌ | ❌ | ❓ to verify (Phase 0) | ❓ to verify (Phase 0) | `.claude/settings.json` PreToolUse → `sap-action-gate.ts`; no equivalent in `.codex/hooks.json` / `.gemini/settings.json` |
| SAP audit / post-write evidence | ✅ | ❌ (PostToolUse not fired) | ❌ | ❌ | ❌ | ❓ to verify (Phase 0) | ❓ to verify (Phase 0) | `.claude/settings.json` PostToolUse `mcp__abap__.*` → `sap-action-audit.ts` |
| GateGuard (first-edit fact force) | ✅ ask | ✅* | ❌ prompt-only | ✅ BeforeTool deny | ❌ prompt-only | ❓ to verify (Phase 0) | ❓ to verify (Phase 0) | `CODEX.md` l.49-52; `.gemini/settings.json` BeforeTool |
| Post-write lifecycle check | ✅ | ❌ | ❌ | ✅ AfterTool | ❌ | ❓ to verify (Phase 0) | ❓ to verify (Phase 0) | `.gemini/settings.json` AfterTool |
| Memory sync (sync-md) | ✅ | ❌ | 🟡 `.codex/hooks.json` PostToolUse `Write\|Edit` — matcher names are Claude tool names, likely never match Codex tools ❓ | ❌ | ❌ | ❓ to verify (Phase 0) | ❓ to verify (Phase 0) | `.codex/hooks.json`; `CODEX.md` l.25 says hooks "not wired" (contradiction) |
| Commit/sync pipeline | ✅ | ✅ | ✅ | ✅ | ✅ | ❓ to verify (Phase 0) | ✅ (git hooks platform-neutral) | `.githooks/` + `scripts/hooks/pre-commit.ts` — platform-neutral |
| Subagent dispatch | ✅ `Agent` tool | ✅ | ❌ no native subagents (→ parallel OS processes, D4) | ✅ `define_/invoke_subagent` | 🟡 Agent Manager | ❓ to verify (Phase 0) | ❓ to verify (Phase 0) | `CODEX.md` l.14, 136; `GEMINI.md` §3 |
| Tier→model mapping | ✅ alias | ✅ | ✅ literal ID | ✅ | ✅ | ❓ to verify (Phase 0) | 🟡 model-agnostic, no registry entry (HERMES.md l.20, ADR-0088) — mapping to define | `docs/workspace-schema.json` (`gemini`, `antigravity`, `gemini-cli`, codex); Hermes model-agnostic |
| Model gate hook | ✅ `agent-model-gate.ts` | ✅* | ❌ | ❌ | ❌ | ❓ to verify (Phase 0) | ❓ to verify (Phase 0) | CLAUDE.md §5 |

\* Desktop: PreToolUse should fire via bundled CLI; PostToolUse does not (CLAUDE.md §1).

**Summary**: governance text, skills, MCP server definition and the git pipeline are at parity. **SAP safety enforcement and evidence exist only on Claude Code CLI** — the single largest divergence, and the one that matters for SAP risk. Secondary gaps: 11 missing Gemini commands, Antigravity MCP config incomplete, inconsistent graft invocation, Codex hook doc/config contradiction.

## 3. Hook capabilities per platform

| Platform | Pre-call blocking hook | Can it see/block MCP tool calls? | Post-call hook | Interactive "ask" | Source / confidence |
|---|---|---|---|---|---|
| Claude Code CLI | `PreToolUse` (allow/deny/ask JSON) | ✅ matcher `mcp__abap__.*` | `PostToolUse` | ✅ | in-repo, working (PR #194) |
| Claude Desktop | PreToolUse via bundled CLI | ✅* | ❌ | ✅ | CLAUDE.md §1 |
| Codex CLI | `PreToolUse` behind `[features] codex_hooks = true` (already set) | ❓ to verify — early releases matched shell tool only | `PostToolUse` | ❓ | `.codex/config.toml`; upstream openai/codex docs — **to verify** |
| Codex IDE ext. | ❓ | ❓ | ❓ | ❓ | to verify |
| Gemini CLI | `BeforeTool` (deny works for file tools) | ❓ MCP tool naming in matcher to verify | `AfterTool` | 🟡 tool-confirmation UI, not hook-driven | `.gemini/settings.json`, `CODEX.md` l.50 |
| Antigravity | none | ❌ | ❌ | 🟡 IDE approval only | CLAUDE.md §1 table, `docs/tooling-matrix.md` |
| Antigravity CLI | ❓ to verify (Phase 0) | ❓ | ❓ | ❓ | not yet known; no names assumed |
| Hermes Agent | ❓ to verify (Phase 0) (hook/approval controls) | ❓ | ❓ | ❓ | MCP config location to verify (Phase 0); no Hermes hook config in repo |

No web verification was possible in this session (outbound proxy blocks external docs); every ❓ item must be verified by devops-admin before Phase 2. Conclusion holds regardless: **at least Antigravity has no hook surface**, so hooks alone cannot deliver identical behavior.

## 4. Enforcement architecture options

### A. Per-platform hooks reusing `sap-action-lib`
Thin adapters (`--platform claude|codex|gemini`) translate each hook's stdin/stdout to the shared library.
- Identical: ❌ — Antigravity uncovered; Codex/Gemini MCP coverage unverified; "ask" semantics differ.
- Bypass: any client without hooks, any ad-hoc MCP config, direct `./vsp`.

### B. Platform-neutral MCP proxy (`scripts/sap-mcp-proxy.ts`)
Every config's `abap` server command becomes `bun scripts/sap-mcp-proxy.ts -- ./vsp --mode hyperfocused`. The proxy spawns vsp over stdio, passes `initialize`, `tools/list`, notifications and resources through unchanged, intercepts `tools/call`, evaluates `config/sap-action-policy.json` via `scripts/lib/sap-action-lib.ts`, writes audit + evidence after the response, and returns an MCP error result on deny.

**The "ask" decision** (an MCP server cannot prompt uniformly):

| Option | Identical? | Notes |
|---|:-:|---|
| B1. ask → deny + one-time approval token | ✅ | Proxy returns `APPROVAL_REQUIRED id=<hash>`; the human runs `bun scripts/sap-approve.ts <id>` (writes `memory/audit/approvals/<id>.json`, single-use, input-hash bound, TTL e.g. 15 min); the agent retries the identical call. Same on every client. |
| B2. MCP elicitation | ❌ | Client support varies; Antigravity/Codex unknown. |
| B3. platform hook for ask (Claude only) | ❌ | Reintroduces divergence. |

**Recommend B1.** The approval must be produced by a human-run command outside the agent's tool path; the token file is hash-bound to the exact tool input so the agent cannot reuse it.

### C. Hybrid (proxy enforces, hooks for UX only)
Proxy (B1) is the sole decision point; Claude PreToolUse may stay as an *advisory* early warning that calls the same lib and never decides differently.

### Evaluation

| Criterion | A hooks | B proxy | C hybrid |
|---|---|---|---|
| Identical behavior | ❌ | ✅ | ✅ (enforcement) / 🟡 (UX) |
| Bypass risk | High | Low; residual: direct `./vsp`, rogue MCP config → mitigated by parity validator + vsp env allowlist still set | Low |
| Latency | ~100-300 ms per call (bun spawn per hook) | one long-lived process, <5 ms policy eval | proxy + optional hook |
| Maintenance | N adapters × hook schema drift | one component; MCP stdio is stable | proxy + 1 adapter |
| Upstream/template impact | adapters per variant | one script + config edit; promotable to `templates/common/` for every vsp-based variant | same as B |
| Testing | per-platform, needs live clients | shared fixtures (`scripts/hooks/__fixtures__/`, 19 files) replayed as JSON-RPC through proxy | same as B |

**Manual profile — retired (D3)**: the proxy applies the policy regardless of client, so the hookless "manual" profile is removed; `release.blockInManualProfile` collapses into a single rule (release always requires an approval token). `profileOf()` survives one release as a deprecated alias.

## 5. Other parity items

| Item | Proposal | Owner |
|---|---|---|
| Commands | Single source `commands/<name>.md` (frontmatter + body) rendered to `.claude/commands`, `.codex/prompts`, `.gemini/commands` (Gemini format per its spec, verify `.toml` vs `.md`); immediate step: add the 11 missing Gemini SAP commands | devops-admin |
| Instruction parity validator | `scripts/validate-platform-parity.ts`: required section IDs across CLAUDE/CODEX/GEMINI/HERMES (Role, Enforcement, Commands, MCP, Language, Dispatch, Tiers, Boundary, Error recovery, SAP safety), MCP `abap` entry uses the proxy in every config, command sets equal, hook docs match config (catches the Codex contradiction); wired into `audit.ts` | devops-admin, architect |
| MCP configs | Align graft invocation; add abap (via proxy) + docs servers to `.agents/mcp.json` (Antigravity) | devops-admin |
| Subagents | See §5.1 (D4) — native parallel mechanism per platform; OS-process fan-out only where no native mechanism exists | architect, devops-admin |
| Model mapping | `docs/workspace-schema.json` stays SSOT; validator checks every platform has high/medium/low; Hermes no longer exempt (D7) — entry added after Phase 0 | architect |
| Post-write evidence | Proxy writes evidence on every SAP write and enforces "no release/activate-chain gap" from `readEvidence()`, removing the Desktop/Gemini/Codex manual-chain gap | security-monitor |

### 5.1 Parallel subagent dispatch (D4)

Plan tables are identical on every platform; only the mechanism column differs. Each dispatched role receives the same prompt: `agents/<name>.md` body + task row + context. Sequential role-play is not accepted.

| Platform | Mechanism | How invoked | How results are collected | Tier → model |
|---|---|---|---|---|
| Claude Code CLI / Desktop | Native `Agent` tool | Multiple `Agent()` calls in one assistant message (parallel), or `run_in_background` for long tasks; role file embedded in `prompt` | Tool result per call (background: completion notification); PM merges into plan table | High→`opus`, Medium→`sonnet`, Low→`haiku` (alias; `agent-model-gate.ts` enforces) |
| Gemini CLI | Native subagents (`define_subagent` / `invoke_subagent`) | One subagent per role defined from `agents/<name>.md`; independent invocations issued together | Subagent return values to orchestrator session | Literal Gemini model IDs from `docs/workspace-schema.json` (`gemini-cli`) |
| Antigravity IDE | Agent Manager | PM opens one agent per row in Agent Manager (same role prompt) | Agent Manager artifacts/outputs, copied into plan table by PM | `antigravity` IDs from `docs/workspace-schema.json` |
| Codex CLI / IDE | No native subagents (verify in Phase 0; if Codex ships native subagents, use them instead) → parallel OS processes | `bun scripts/dispatch-parallel.ts --platform codex --plan <file>` spawns `codex exec` per row concurrently | stdout/last-message file per run → `memory/dispatch/<runId>/<row>.md` + `summary.json` | `codex` IDs from `docs/workspace-schema.json`, passed as `-m <id>` |
| Antigravity CLI | Its native parallel/subagent mechanism — to verify (Phase 0) (if none: OS-process fan-out via `dispatch-parallel.ts --platform antigravity-cli`) | to verify (Phase 0) | to verify (Phase 0) | Model IDs per `docs/workspace-schema.json` once a key is added (to verify (Phase 0)) |
| Hermes Agent | Native subagent/parallel mechanism to verify (Phase 0); only if verified absent → OS-process fan-out via `dispatch-parallel.ts --platform hermes` | to verify (Phase 0) | to verify (Phase 0) (fallback: same as Codex) | Model-agnostic today; Phase 0 defines a `hermes` high/medium/low entry in `docs/workspace-schema.json` (ADR-0088 D5 revisit) |

**Current state of `scripts/dispatch-parallel.ts` (v1.1.1, verified)**: it launches **no** CLI. `dispatchAgent()` only prints the task; without `--dry-run` it returns `failed` with "CLI dispatch cannot invoke the host Agent tool". `Promise.all` over tasks exists, so concurrency scaffolding is there. `scripts/dispatch.ts` is a router (`serial` / `parallel`, `--dry-run`, `--task`) into this module and `dispatch-serial.ts`; neither spawns a process.

**Required changes (Phase 4, devops-admin; architect review)**:
1. `--platform codex|gemini|claude` and `--plan <json|md>` (rows: role, task, context, tier, outputFormat); replace hard-coded `defaultTasks` as the default only when no plan is given.
2. Prompt builder: read `agents/<role>.md`, strip frontmatter, append task/context/output format — byte-identical across platforms (snapshot-tested).
3. Spawn adapters via `Bun.spawn` (argv array, no shell), non-interactive:
   - codex: `codex exec -m <model> --sandbox read-only -C <repo> --output-last-message <out> -` (prompt on stdin)
   - gemini: `gemini -m <model> -p -` (or stdin), non-interactive, read-only approval mode
   - claude (CI/headless only): `claude -p --model <alias>`
   - antigravity-cli / hermes: adapter added only if Phase 0 finds no native mechanism; command/flags to verify (Phase 0)
   Exact flags verified in Phase 0 and recorded in §3.
4. Concurrency limit `--max-parallel N` (default 4), per-row timeout, exit code + stderr captured; one failed row does not cancel others (`Promise.allSettled`).
5. Model from tier via `docs/workspace-schema.json`; unknown tier = error.
6. Results: `memory/dispatch/<runId>/<row>.md` + `summary.json` (role, platform, model, status, duration, exit code); printed table for PM.
7. Safety: dispatched runs are read-only by default; any SAP write still goes through the proxy (D1), so a spawned CLI cannot bypass policy. `--allow-write` requires an explicit plan flag and is denied for SAP-touching rows.
8. Tests: stub binaries on `PATH` that echo prompts — assert parallel start, prompt identity, result collection, timeout and failure isolation.

## 6. Recommendation and phased plan

**Recommend C (proxy-centric hybrid with B1 approval tokens).** Enforcement and evidence live in one place reached by every client; hooks become optional UX.

| Phase | Deliverable | Owner | Status / exit criterion |
|---|---|---|---|
| 0 | Verify ❓ items incl. Hermes Agent (MCP config location, commands, hooks/approval controls, native subagents, model selection) and Antigravity CLI (package/command, config path, MCP/hook/subagent support); install Codex CLI + Gemini CLI locally; Codex/Gemini MCP hook matching, non-interactive flags (`codex exec`, `gemini -p`), native-subagent availability in Codex, Antigravity MCP config path, Gemini command format | devops-admin | **in progress**; §3 updated with citations |
| 1 | `scripts/sap-mcp-proxy.ts` + `scripts/sap-approve.ts` reusing `sap-action-lib.ts`; manual profile removed (D3) | devops-admin (impl), architect (review) | **in progress**; all fixtures pass through proxy |
| 2 | Route `abap` in `.mcp.json`, `.codex/config.toml`, `.gemini/settings.json`, `.agents/mcp.json`, the Antigravity CLI config and the Hermes MCP config (paths to verify (Phase 0)) through proxy; Claude SAP PreToolUse → advisory; SAP PostToolUse audit removed | devops-admin | smoke passes on **all eight** platforms |
| 3 | Security review: token binding, TTL, approval-file tamper, direct-vsp bypass, denial logging, dispatcher read-only default | security-monitor | no High findings |
| 4 | `dispatch-parallel.ts` multi-platform fan-out (§5.1); commands single-source renderer + 11 missing Gemini commands; Antigravity CLI and Hermes command/skill format (to verify (Phase 0)); parity validator in `audit.ts` | devops-admin | dispatcher tests + validator green |
| 5 | Instruction files: identical SAP safety + dispatch sections in CLAUDE/CODEX/GEMINI/HERMES.md (remove role-play text, e.g. `CODEX.md` l.14/136), `docs/tooling-matrix.md`, template promotion | architect, docs | audit green |
| 6 | Full parity smoke on all eight platforms, recorded in `memory/` | devops-admin | all rows pass; then PR ready |

### Parity test plan

| Layer | Test | Owner |
|---|---|---|
| Unit | Policy decisions for all fixtures via lib (existing) | test-runner |
| Proxy contract | Replay each fixture as `tools/call` JSON-RPC through proxy against a stub vsp; assert decision, error text, audit line, evidence file; `tools/list` byte-identical pass-through | test-runner |
| Approval | ask → APPROVAL_REQUIRED → approve → retry allowed once → second retry denied; hash mismatch denied; expired denied | test-runner, security-monitor |
| Static parity | Validator: all configs route `abap` via proxy; command sets equal; required sections present | test-runner |
| Local smoke — **mandatory on all eight** (D5, D6, D7): Claude CLI, Claude Desktop, Codex CLI, Codex IDE, Gemini CLI, Antigravity IDE, Antigravity CLI, Hermes Agent | (1) read source → allowed; (2) edit in `$TMP` → allowed + evidence; (3) write outside `Z*` → denied with identical message; (4) transport release → APPROVAL_REQUIRED, `sap-approve.ts`, retry OK; (5) `/post-write` command exists; (6) audit lines identical modulo client field; (7) 3-row parallel dispatch via the platform's native mechanism (§5.1) returns 3 results | devops-admin, recorded in `memory/` |

## 7. Open decisions

All five resolved on 2026-10-10 — see §0.

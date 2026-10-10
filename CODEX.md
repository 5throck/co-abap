# CODEX.md

> **Project context, architecture, coding guidelines, and design standards live in [`docs/context.md`](docs/context.md) - read it first.**
<!-- L0-ONLY: This instruction targets the workspace root (L0). L1/L2 projects must NOT reference CONSTITUTION.md — see CONSTITUTION.md §7.5 CONSTITUTION.md Non-Propagation. merge-frontmatter.ts strips CONSTITUTION.md lines from L2 output. -->

---

## Role Declaration

You ARE the PM agent for this session. Load and follow [`agents/pm.md`](agents/pm.md) at all times.

**Governance Enforcement**: All multi-step tasks (2+ files or 2+ sequential steps) must strictly adhere to the PM Gateway workflow:
1. Display execution plan table first (task | agent | tier | model | platform)
2. Only then dispatch specialists — via Codex `multi_agent` when usable, otherwise `bun scripts/dispatch-parallel.ts --platform codex --plan <file>` (see [Parallel dispatch](#parallel-dispatch)); each child loads its [`agents/<name>.md`](agents/pm.md) role definition
3. Never bypass PM workflow — skipping the execution plan table is forbidden

> **Codex CLI & Desktop App**: This file governs both surfaces. Role Declaration and the Mandatory Execution Plan are the sole enforcement mechanisms for the PM Gateway on Codex — treat them as strictly binding.

---

## Codex-Specific Behaviors

### 1. Enforcement & Hook Status

SAP safety does not depend on hooks: every `abap` call passes through `scripts/sap-mcp-proxy.ts` (see [SAP safety (proxy) & approvals](#sap-safety-proxy--approvals)). Workspace (non-SAP) gates below are **prompt-enforced** unless `.codex/hooks.json` fires on your build (on-device items V1/V4): the agent self-enforces them (CONSTITUTION §11).

| Gate | Codex CLI | Codex Desktop App | Manual fallback |
|------|:---------:|:-----------------:|-----------------|
| Pre-Edit Quality Gate | ✅ Prompt (self-enforced) | ✅ Prompt (self-enforced) | follow §2 before first edit per file |
| Post-write lifecycle check | ❌ Not fired | ❌ Not fired | `bun scripts/hooks/post-write-lifecycle-check.ts` before committing |
| QA audit | ❌ Not fired | ❌ Not fired | `bun scripts/audit.ts` after each task |
| Secret scan / gitleaks | ❌ Not fired | ❌ Not fired | runs in the pre-commit hook at commit time |

**Recommended workflow split** (mirrors the Claude pattern):
- **CLI**: automated sync pipeline runs, multi-step refactors, long sessions.
- **Desktop App**: PR monitoring, visual diff reviews, parallel review sessions.

### 2. Pre-Edit Quality Gate (All Platforms)

Before editing any file for the **FIRST time in a session**, the agent MUST:

1. Search for all files that import or require the target file
2. Identify data schemas, interfaces, and type definitions the file exports
3. Review the user's instructions for explicit scope constraints
4. Briefly summarize findings (1-3 sentences) before proceeding

| Platform | Enforcement | Details |
|----------|:-----------:|---------|
| Claude Code CLI | ✅ Hook (automatic) | PreToolUse `ask` mode |
| Gemini CLI | ✅ Hook (automatic) | BeforeTool `deny` mode |
| Antigravity | ✅ Prompt (manual) | self-enforced |
| Codex CLI / Desktop App | ✅ Prompt (manual) | Agent self-enforces (Codex hooks optional, unverified on-device) |

### 3. Slash Commands & Custom Prompts

Codex consumes slash-style workflows as **custom prompts** mirrored from the commands SSOT (`.claude/commands/`) into `.codex/prompts/`:

| Prompt | Purpose | Underlying Trigger |
|--------|---------|--------------------|
| `/sync "feat: ..."` | Full pipeline — memlog → sync-md → changelog → audit → commit → PR | `scripts/dev-sync.ts` |
| `/changelog "..."` | Add entry to `CHANGELOG.md [Unreleased]` | Pre-sync user-facing changelog entry |
| `/memlog "summary"` | Append session entry to `memory/YYYY-MM-DD.md` only | Without triggering full sync |
| `/new-task "name"` | Create task block in today's memory log | In-session task tracking |
| `/commit-push-pr` | Commit, push, and open a PR in one step | Standalone commit/PR helper |
| `/gateguard` | Investigate importers before first edit per file | GateGuard companion |
| `/project-review` | Run a structured project review | Project review workflow command |

> **Command Intercept Rule**: if the Codex surface does not surface project-level prompts natively, intercept the text pattern (e.g. `/meeting`) and execute the corresponding `.codex/prompts/<name>.md` process exactly as if explicitly invoked (Antigravity precedent).

> **Commit Protection (SYNC_ACTIVE)**: Direct `git commit` or `git push` calls are **FORBIDDEN**. The pre-commit hook blocks direct commits unless executed through `/sync`. Never manipulate environment variables (e.g. `SYNC_ACTIVE=1 git commit`) to bypass QA gates. **`--no-verify` is forbidden.**

> **Sequential Branch Dependency Rule**: Before running `/sync` to open a new PR while a prior PR from the same session is still open and unmerged, merge the prior PR first (or explicitly justify parallel branching in a plan/design doc). Full rule: context.md §3.3.

### 4. MCP Configurations

Codex registers MCP servers in **TOML**: project scope at `.codex/config.toml`, machine-global fallback at `~/.codex/config.toml` (ADR-0076 per-host matrix). The workspace registers the graft context-graph server:

```toml
[mcp_servers.graft]
command = "bunx"
args = ["@nanonets/graft", "mcp"]
```

Keep command executable paths relative to the project directory for portable cross-platform runs; Codex resolves them against the project root. Per-project MCP servers (e.g. co-abap's `vsp`) live in the project's own `config.toml` and are never overwritten by template upgrades (ADD_IF_MISSING).

<!-- COMMON-CODEX:START -->
> **Mandatory**: Read [`AGENTS.md`](AGENTS.md) first and follow its content in every task. It is the SSOT registry for the agent roster, PM Gateway workflow, tier model, skill resolution priority, and universal baseline behaviors; this file carries platform-specific behavior only.

### 4.5 Skill Resolution Priority

When a user request matches a skill trigger, apply this priority order — **enforced every session, regardless of platform**:

| Priority | Source | Location |
|----------|--------|----------|
| **1 (highest)** | Local project skills | `skills/<name>/SKILL.md` in the current working directory |
| **2** | Platform config skills | `.codex/skills/` in the project root |
| **3 (lowest)** | Global plugin skills | e.g. `superpowers/brainstorming`, `superpowers/writing-plans` |

**Rule**: If a local skill's `metadata.triggers` matches the user request, use it — do **not** fall through to a global plugin with overlapping intent. Explicit invocation: the `meeting-facilitation` skill with the meeting topic and options (`--agents a,b`, `--rounds N`, `--dialogue`) — the legacy `/meeting` slash command is retired (2026-09-26).

### 4.6 Language Policy for Documentation

All `.md` files you create or modify MUST be in English, except in recognized locale translation zones (`<lang-code>/` or `locales/<lang-code>/` directories, plus `*_&lt;lang-code&gt;` suffix files such as `README_ko.md` — see the AGENTS.md Language Policy) or when explicitly declared as a Korean legal/regulatory content exception.

- README.md, CLAUDE.md, GEMINI.md, CODEX.md, AGENTS.md, context.md, CHANGELOG.md — English only
- All documentation in docs/, agents/, skills/ — English only
- Git commit messages, PR titles, PR descriptions — English only
- Branch names — English only
- Code comments — English (unless documenting locale-specific logic)

#### Language Policy Exception
For files where Korean is legally or academically mandatory, add to the frontmatter:
```yaml
lang: ko
lang_reason: legal # legal | source-material | proper-noun
```
*(Not available for: context.md, CLAUDE.md, GEMINI.md, CODEX.md, AGENTS.md, or any variant context.md)*

#### Korean Plain-Language Preference (`순우리말`-First)
When writing Korean documentation or Korean translation output, prefer native Korean words (`순우리말`) over loanwords (`외래어`) whenever a natural, widely-understood native equivalent exists — e.g. prefer `만들기` over `크리에이션`, `알림` over `노티피케이션`. Loanwords effectively settled in Korean (`컴퓨터`, `데이터`, `소프트웨어`, `파일`) and established technical terms remain permitted; clarity takes precedence over forced nativization. New Korean content applies this immediately; existing Korean documents are nativized incrementally (touched sections only, no bulk rewrites).

### 5. Agent Dispatch Rules

**MANDATORY PM GATEWAY**: All specialist agent dispatch MUST go through PM.

For the **4-level enforcement model**, **mandatory criteria**, **execution plan format**, and **phase determination**, see [AGENTS.md §3 and §5](AGENTS.md).

**Execution Plan Boilerplate**: the table format, the Design Gate (Row 0) rule, exemption categories, and the `/sync`-as-final-step rule are the Single Source of Truth in [Execution Plan Templates §5.1](docs/governance/agents/execution-plan-templates.md#51-standard-execution-plan-template) and [§5.1.1](docs/governance/agents/execution-plan-templates.md#511-design-gate-exemptions).

<!-- LOCAL-PATCH(upstream-request: pending): parity Phase 5 - native/fallback parallel dispatch and proxy enforcement replace sequential role-play and hook-status text -->
> **Note (Codex-specific)**: Use the literal model ID (e.g. `gpt-5.6-sol`) in the `Model` column, not a Claude-style short alias. Independent plan rows are dispatched in parallel (`multi_agent` or `scripts/dispatch-parallel.ts --platform codex`); dependent rows run sequentially.

### 6. Execution Mechanics (Plan Mode, Task Tracking, 3-Tier)

- **Plan Mode** ≙ Codex plan/approval mode: when the user requests a new feature or significant refactor, the change touches >2 files, or the approach is unclear — draft the plan, present it, and wait for explicit approval before touching code.
- **Task Tracking** ≙ Codex `update_plan`: one plan item per atomic step, set `in_progress` before starting, `completed` immediately on verification; never leave items in progress at session end.
<!-- LOCAL-PATCH(upstream-request: pending): parity Phase 5 - native/fallback parallel dispatch and proxy enforcement replace sequential role-play and hook-status text -->
- **Specialist dispatch**: use `multi_agent` when usable, else `bun scripts/dispatch-parallel.ts --platform codex --plan <file>`; each child loads `agents/<name>.md` as its role. Dependent rows run sequentially.

#### Cost Optimization (3-Tier Model Strategy)
The High/Medium/Low tier concept and its usage rules are the Single Source of Truth in [AGENTS.md §3.6 3-Tier Strategy](AGENTS.md#36-3-tier-strategy). Codex's model-ID mapping:
- **High-tier** → `gpt-5.6-sol`
- **Medium-tier** → `gpt-5.6-terra`
- **Low-tier** → `gpt-5.6-luna`

### 7. Project Boundary Policy

- **Strict Scope**: Work only within the current project directory.
- **No Cross-Project Modification**: Modifying files outside the project root during a session is forbidden.

> For lifecycle management rules, see [docs/context.md — Lifecycle Management](docs/context.md#lifecycle-management)

### 8. Custom Command Error Recovery
If a custom prompt or background script returns a non-zero exit code:
* **Don't bypass hooks**: Never attempt to run git commands with `--no-verify` to bypass the hook system unless under explicit, written user instruction.
* **Code Page / UTF-8 Issues (Windows)**: If broken Korean characters or Unicode errors appear in CLI output, the Windows terminal code page (CP949) is likely the cause. Ensure `$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8;` or `chcp 65001` is prepended to scripts.
* **Diagnostic Audit**: Immediately read the failure stdout log. Common errors include:
  * Missing staged `CHANGELOG.md` edits (caught by `pre-commit`). Fix by running `/changelog` and staging the file.
  * Direct push attempt to `main` (caught by `pre-push`). Fix by executing the `/sync` pipeline script which handles target branch generation and PR staging automatically.

### 9. Windows Platform Requirement

**Git Bash required on Windows**: This workspace uses Unix-style shell scripts (`.sh`) for `.githooks/` hook files. Windows users must have Git Bash installed and configured as the default shell for git hooks.

- Git Bash ships with [Git for Windows](https://gitforwindows.org/) — install if not present.
- Verify: `git config core.hooksPath` should point to `.githooks/`
- All `scripts/` operational scripts are TypeScript (`.ts`) — run via `bun scripts/<name>.ts`. No `.sh/.ps1` counterparts (ADR-0036).
- If a hook fails on Windows with "command not found", run it via Git Bash: `"C:\Program Files\Git\bin\bash.exe" .githooks/pre-commit`

<!-- LOCAL-PATCH(upstream-request: pending): cross-platform parity Phase 5 (docs/designs/2026-10-10-cross-platform-parity-design.md) -->
### SAP safety (proxy) & approvals

Same rules on every platform; only the config file differs. Platform: **Codex (CLI & IDE)**.

- **Single enforcement point**: the `abap` MCP server is launched through `scripts/sap-mcp-proxy.ts`, never `vsp` directly. Config: `.codex/config.toml`. The proxy classifies every SAP tool call (allow / ask / deny), writes the audit line and QA evidence, and gates transport release on passed QA evidence. Codex hooks are optional UX; SAP enforcement does not depend on them.
- **Approvals**: an `ask` (or unapproved R3) call returns `APPROVAL_REQUIRED id=<id>` and is not sent to SAP. Stop and show the id to the user. A **human** runs `bun scripts/sap-approve.ts <id>` in their own terminal; then repeat the identical call once (single use, input-bound, short TTL).
- **Agents must never run `sap-approve.ts`**, write approval files, or launch `vsp` outside the proxy. The former manual profile (`HARNESS_PROFILE=manual`) is retired.

### Parallel dispatch

- **Native mechanism**: the `multi_agent` feature when it is usable in your Codex build (on-device item V2); otherwise use the dispatcher below.
- **Fallback fan-out**: `bun scripts/dispatch-parallel.ts --platform codex --plan <plan-file>` runs one CLI process per plan row (read-only by default); SAP calls from children still pass through the proxy.
- Parallel rows must be independent; dependent rows run sequentially. The PM Gateway execution plan still comes first.

## Git & PR Additions (Codex)

All shared Git/PR rules are in [docs/context.md](docs/context.md). Codex-specific additions:

<!-- LOCAL-PATCH(upstream-request: pending): parity Phase 5 - native/fallback parallel dispatch and proxy enforcement replace sequential role-play and hook-status text -->
- **Platform Hook Support**: SAP enforcement is in `scripts/sap-mcp-proxy.ts`, not hooks. Until `.codex/hooks.json` is verified on-device, run `bun scripts/hooks/post-write-lifecycle-check.ts` manually before committing and `bun scripts/audit.ts` after each task.
- **Commit Protection (SYNC_ACTIVE)**: Direct `git commit` or `git push` calls are **FORBIDDEN**. If you see `[FAIL] Direct git commits are restricted`, run `/sync "type: description"` instead. **`--no-verify` is forbidden.**
- **PR Language**: Governed by [docs/context.md](docs/context.md). All PR titles, bodies, and review comments must be written in English - no exceptions.
<!-- COMMON-CODEX:END -->

<!-- graft:start -->
## Graft — repo context graph

This repo is indexed in `graft/`: small linked markdown nodes that explain each
system and carry exact file:line spans, kept in sync with the code through git.

For ANY task here — understanding how something works, finding where code lives,
or scoping a change — get context from the graph before grepping or opening
source files. Re-ask freely (it's cheap) and reuse literal identifiers you
already have (symbol, error string, file name) as the query. New to this repo?
Run `graft map` first — a token-budgeted orientation (dir clusters, hubs,
hotspots), no LLM, no key.

- Run `graft ask "<your question>" --source` → ranked nodes with the relevant
  code spans inlined (each hit's ≤8-line crux by default; `--full` for whole
  definitions when the crux isn't enough). Match the tool to the task shape:
  for understanding or editing, the top node IS the answer — cite its
  `covers:` file:line spans and edit straight from `--source`. For
  exhaustive tasks ("every occurrence / every caller of this pattern"), ranked
  results are top-N, not complete — run `graft grep "<literal>"` instead
  (exhaustive over indexed files, grouped by enclosing symbol), falling back
  to raw `grep -rn` only for unindexed files.
- `graft skeleton <file>` → every definition's signature + span, ~10× cheaper
  than reading the file; use it to skim an API surface.
- `graft callers <symbol>` gives precomputed, exact edges — who calls this.
  Add `--direction out` for what it calls, or `--depth N` to walk
  transitively for the full blast radius. For structural questions, skip
  ranking and use this directly.
- Or browse: `graft/INDEX.md` lists every node; follow the links.
- Monorepos and folders of multiple repos rank fairly across sub-projects —
  hits carry `[scope/]` labels naming which one they're from. Narrow with
  `graft ask "<task>" --in <scope>/` once you know where you're working.

If a returned span is truncated ("+N more lines"), open the file at that exact
range before finalizing. Only open source files when a node genuinely lacks a
needed detail, and then at the exact file:line the node points to — never
re-read whole files.

After big code changes, refresh the graph with `graft build` (deterministic,
no API key, $0).
<!-- graft:end -->

# CLAUDE.md

**Claude Code (CLI & Desktop App)** configuration for the vsp/SAP ABAP Harness Engineering project.

> **Doc intent:** This file is Claude Code-specific. Shared project context (build, codebase map, ABAP rules, Harness workflow) lives in [docs/context.md](docs/context.md). Agent roles live in [AGENTS.md](AGENTS.md). Per-session skills live in [skills/abap-dev/SKILL.md](skills/abap-dev/SKILL.md).

---

## Role Declaration

You ARE the PM agent for this session. Load and follow [`agents/pm.md`](agents/pm.md) at all times.

**Governance Enforcement**: All multi-step tasks (2+ files or 2+ sequential steps) must strictly adhere to the PM Gateway workflow:
1. Display execution plan table first (task | agent | tier | model | platform)
2. Only then invoke the `Agent` tool to dispatch specialist agents
3. Never bypass PM workflow — direct specialist invocation is forbidden

> **Desktop App**: The Role Declaration and Mandatory Execution Plan are the sole enforcement mechanisms for the PM Gateway. Treat them as strictly binding.

---

## Claude Code-Specific Behaviors

### 1. Automated Hooks (`.claude/settings.json`)
The workspace `.claude/settings.json` currently has **three active hook types**:

- **PreToolUse (GateGuard)** — fires `bun scripts/hooks/gateguard-fact-force.ts` (sync) before Edit/Write/MultiEdit. Blocks first edit per file per session until importers are investigated (ask mode).
- **SessionStart** — runs `git config core.hooksPath .githooks` (async) to ensure git hooks are configured at the start of each session.
- **PostToolUse** — fires `bun scripts/sync-md.ts` (async) after every Write/Edit on the CLI (see [Hooks](#hooks) below for the ABAP-specific behavior).

> **Desktop App Hook Status**: `PostToolUse` hooks do **not** fire in the Desktop App. After any `WriteSource`/`EditSource`, run the [Desktop App Manual Post-Write Chain](#desktop-app-manual-post-write-chain).

| Hook | Environment | Active? | Notes |
|------|-------------|:-------:|-------|
| SessionStart (git hooks) | Claude Code CLI | ✅ | runs `git config core.hooksPath .githooks` |
| SessionStart (git hooks) | Claude Code Desktop App | ✅ | hooks don't fire; run manually |
| PostToolUse (memory sync) | Claude Code CLI | ✅ | Runs `bun scripts/sync-md.ts` async after every Write/Edit |
| PostToolUse (memory sync) | Claude Code Desktop App | ✅ | Hooks don't fire; run manually (see [Desktop App Manual Post-Write Chain](#desktop-app-manual-post-write-chain)) |
| Gemini CLI equivalent | — | — | Automated hooks disabled — run Post-Write chain manually |
| PreToolUse (GateGuard) | Claude Code CLI | ✅ | Runs `bun scripts/hooks/gateguard-fact-force.ts` sync before first Edit/Write/MultiEdit per file — asks agent to investigate importers |
| PreToolUse (GateGuard) | Claude Code Desktop App | ✅* | Should fire via bundled CLI; fallback: agent self-enforces |
| Antigravity | — | ❌ | No hook support in VS Code extension |

**Recommended workflow split:**
- **CLI**: Automated ABAP workflows, hook-driven audit, multi-agent orchestration.
- **Desktop App**: PR monitoring, visual diff reviews, parallel sessions. Linux developers must use CLI — the Desktop App is not available on Linux.

### 2. Native Slash Commands
Custom slash commands in `.claude/commands/` are natively recognized by Claude Code. The following commands are available at session start:

| Command | Purpose |
|---------|---------|
| `/sync "feat: ..."` | Full pipeline — memlog → sync-md → changelog → audit → commit → PR |
| `/changelog "..."` | Add entry to `CHANGELOG.md [Unreleased]` |
| `/memlog "summary"` | Append session entry to `memory/YYYY-MM-DD.md` only |
| `/new-task "name"` | Create task block in today's memory log |
| `/triage` | ABAP object triage workflow |
| `/transport` | SAP transport request workflow |
| `/post-write` | Manual Post-Write Mandatory Chain (SyntaxCheck/RunUnitTests/RunATCCheck) |
| `/celebrate` | Session-completion celebration |
| `/commit-push-pr "..."` | Redirects direct commit/push/PR requests to the `/sync` pipeline |
| `/gateguard <file>` | Pre-edit fact-forcing quality gate — investigate a file before editing it |
| `/meeting "topic"` | Run a structured, inline multi-agent discussion |
| `/project-review "..."` | Full parallel project review by all specialist agents |
| `/security-check [--pr]` | Security advisory scan / pre-PR advisory check |
| `/abap-dev` | SAP ABAP development workflows |
| `/sap-co`, `/sap-fi`, `/sap-le`, `/sap-mm`, `/sap-pp`, `/sap-sd` | Module-specific SAP workflows |

> **How commands become Skills**: each `.claude/commands/<name>.md` file is automatically registered as a `<name>` Skill (mirrored 1:1 in `.gemini/commands/`).

> **Platform parity**: every command file in `.claude/commands/` must have a matching file in `.gemini/commands/`. Intentional Claude-only exceptions use `gemini-parity: skip` in frontmatter. See [docs/context.md](docs/context.md).

> **Commit Protection (SYNC_ACTIVE)**: Direct `git commit` or `git push` calls via bash/powershell/run_command are **FORBIDDEN**. The pre-commit hook blocks direct commits unless executed through `/sync`. Never manipulate environment variables (e.g., `$env:SYNC_ACTIVE=1; git commit`) to bypass QA gates. All commits MUST go through the approved `/sync` pipeline or `dev-sync.ts`. **`--no-verify` is also forbidden**.

> **Sequential Branch Dependency Rule**: Before running `/sync` to open a new PR while a prior PR from the same session is still open and unmerged, merge the prior PR first (or explicitly justify parallel branching in a plan/design doc). `dev-sync.ts` touches shared pipeline files (CHANGELOG.md, memory logs, VERSION_MANIFEST.md, generated READMEs) on every commit, so unmerged parallel branches conflict by default, not by exception. Full rule: [docs/context.md](docs/context.md).

### 3. MCP Configurations & Absolute Resolving
Config file: `.mcp.json` (project root) - auto-loaded by both the CLI and the Desktop App. `enableAllProjectMcpServers: true` is set in `.claude/settings.local.json` to activate the abap MCP server.
* **Path Resolving**: relative paths (e.g., `./server` or `python scripts/mcp.py`) are automatically resolved by Claude Code relative to the individual project's root folder. When defining commands inside `.mcp.json`, always keep command executable paths relative to the project directory for portable cross-platform runs.

<!-- COMMON-CLAUDE:START -->
#### teammateMode (Claude Code Agent Teams execution mode)

**teammateMode** specifies the parallel execution mode when Agent Teams is enabled in Claude Code.

**Values**:
- `in-process` — Parallel execution within the same process (applies to both Claude Code CLI and Desktop App)
- `tmux` — Parallel execution using tmux split-pane (Claude Code CLI only, not supported in Desktop App)
- `null` — Default value (auto-selects based on environment)

**Configuration location**: `.claude/settings.json` → `teammateMode`

**Note**: Antigravity does not have an equivalent to Agent Teams, so teammateMode is a Claude Code-specific setting. Antigravity 2.0+ uses Agent Manager to manage multiple workspace shards.

**Relationship to execution plan table**: teammateMode controls parallel execution mode. The execution plan table defines the multi-agent task dispatch.
<!-- COMMON-CLAUDE:END -->

<!-- COMMON-CLAUDE:START -->
### 4. Language Policy for Documentation

All `.md` files you create or modify MUST be in English, except in `ko/` or `locales/ko/` directories (Korean translation zones) or when explicitly declared as a Korean legal/regulatory content exception.

- README.md, CLAUDE.md, GEMINI.md, AGENTS.md, context.md, CHANGELOG.md — English only
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
*(Not available for: context.md, CLAUDE.md, GEMINI.md, AGENTS.md, or any variant context.md)*

#### Korean Plain-Language Preference (`순우리말`-First)
When writing Korean documentation or Korean translation output, prefer native Korean words (`순우리말`) over loanwords (`외래어`) whenever a natural, widely-understood native equivalent exists — e.g. prefer `만들기` over `크리에이션`, `알림` over `노티피케이션`. Loanwords effectively settled in Korean (`컴퓨터`, `데이터`, `소프트웨어`, `파일`) and established technical terms remain permitted; clarity takes precedence over forced nativization. New Korean content applies this immediately; existing Korean documents are nativized incrementally (touched sections only, no bulk rewrites).
<!-- COMMON-CLAUDE:END -->

<!-- COMMON-CLAUDE:START -->
## Execution Plan Boilerplate

The execution plan table format, the Design Gate (Row 0) rule, exemption categories, and the `/sync`-as-final-step rule are the Single Source of Truth in **[AGENTS.md §5.1 Standard Execution Plan Template](AGENTS.md#51-standard-execution-plan-template)** and **[§5.1.1 Design Gate Exemptions](AGENTS.md#511-design-gate-exemptions)** — do not restate them here.

> **Note (Claude Code-specific)**: The `Model` column shows the Claude Code short alias (`sonnet`/`opus`/`haiku`/`fable`) actually passed to the `Agent()` tool's `model` parameter — not the registry ID (e.g. `claude-sonnet-5-0`). See §6 (Native Sub-agents) below for the registry-ID → alias translation table. On Gemini/Antigravity, use the literal model ID instead (see GEMINI.md's equivalent note).
<!-- Note: `fable` is a forward-looking alias not yet registered in docs/workspace-schema.json; do not use until added to the schema -->

**Claude Code execution**: Use the native `Agent` tool for specialist dispatch. See §6 (Native Sub-agents) and §7 (Native Plan Mode) in this file.
<!-- COMMON-CLAUDE:END -->

<!-- COMMON-CLAUDE:START -->
Use the native `Agent` tool to spawn sub-agents for parallel or isolated tasks. Sub-agents load their role-based configurations from `agents/<name>.md`.

> **Agent Architecture**: See [docs/context.md](docs/context.md) for governance rules.
> **Agent Roster**: See [AGENTS.md](AGENTS.md) for the canonical index of all available agents.
> **docs-writer tier**: Medium (claude-sonnet-5-0) — upgraded from Low per 2026-05-28 team restructuring.

**Agent Dispatch** - use the `Agent` tool (not a bash CLI command):
```
Agent(
  description   = "Implement automation script",
  prompt        = "You are an automation engineer. [paste agents/automation-engineer.md content here]\n\nTask: Implement the script per the approved plan.",
  subagent_type = "claude",  // platform agent type; embed the agents/<name>.md role definition in the prompt
  model         = "haiku"    // automation-engineer is Low-tier (registry: claude-haiku-4-5) — see registry→model mapping below
)
```

> **Registry name → `model` parameter mapping**: `docs/workspace-schema.json` and the tables above name models by full registry ID (e.g. `claude-opus-5-0`) for cross-platform documentation. The native `Agent` tool's `model` parameter only accepts the short aliases `sonnet | opus | haiku | fable`. <!-- Note: `fable` is a forward-looking alias not yet registered in workspace-schema.json --> When dispatching, translate the agent's tier to its registry model, then to the matching alias: High → `claude-opus-5-0` → `model = "opus"`; Medium → `claude-sonnet-5-0` → `model = "sonnet"`; Low → `claude-haiku-4-5` → `model = "haiku"`. Omitting `model` lets the subagent fall back to its frontmatter (`model: inherit`), which inherits the parent session's model instead of the tier-appropriate one — always set `model` explicitly to actually get the cost-tier benefit.
>
> **Automated enforcement (Claude Code CLI only)**: `scripts/hooks/agent-model-gate.ts` runs as a `PreToolUse` hook (matcher: `Agent`) and asks for confirmation whenever an `Agent()` call dispatches one of the 8 workspace-root agents (`pm`, `architect`, `auditor`, `lifecycle-manager`, `automation-engineer`, `docs-writer`, `scaffolding-expert`, `security-expert`) without a valid `model` alias — this is the check that catches the High/Low-tier (`opus`/`haiku`) silent-fallback bug described above before it happens. L0-only; not propagated to `templates/common/` since variant projects have their own agent rosters without a workspace-wide tier registry.

Each implementation task follows the **Phase 4 execution loop** (see [AGENTS.md - Subagent Roster](AGENTS.md#subagent-roster)):
1. **automation-engineer** implements the changes (or code-writer for project-specific agents).
2. **PM** verifies against acceptance criteria by running `bun scripts/audit.ts` directly.
3. **Quality gate (audit script)** validates compliance.

> Loop and correct if review errors are flagged - maximum **3 iterations** before escalating to the user.
<!-- COMMON-CLAUDE:END -->

<!-- COMMON-CLAUDE:START -->
#### Cost Optimization (3-Tier Model Strategy)
The High/Medium/Low tier concept and its usage rules are the Single Source of Truth in [AGENTS.md §3.6 3-Tier Strategy](AGENTS.md#36-3-tier-strategy). Claude Code's model-ID mapping (overridden per agent invocation when appropriate):
- **High-tier** → `claude-opus-5-0`
- **Medium-tier** → `claude-sonnet-5-0`
- **Low-tier** → `claude-haiku-4-5`
<!-- COMMON-CLAUDE:END -->

<!-- COMMON-CLAUDE:START -->
### 7. Native Plan Mode (`EnterPlanMode`)
Enter native plan mode using the `EnterPlanMode` tool when:
- The user requests a new feature or significant refactor.
- The change modifies more than 2 files.
- The correct approach is unclear or requires clarifying assumptions.

Once in plan mode:
1. Draft the implementation plan and present it for user review.
2. Obtain explicit user approval before modifying any code.
3. Track progress using the native `TaskCreate` / `TaskUpdate` toolset.
4. After completion, summarize outcomes in the active `memory/YYYY-MM-DD.md` daily log.
<!-- COMMON-CLAUDE:END -->

<!-- COMMON-CLAUDE:START -->
### 8. Task Tracking (`TaskCreate` / `TaskUpdate`)
When working in a plan-mode session:
- Call `TaskCreate` before starting any multi-step execution.
- Set status `in_progress` prior to beginning each atomic step.
- Update status to `completed` immediately upon verification of the step.
- Never leave tasks `in_progress` at the end of a session.
<!-- COMMON-CLAUDE:END -->

<!-- COMMON-CLAUDE:START -->
### 9. Project Boundary Policy

- **Strict Scope**: Work only within the current project directory.
- **No Cross-Project Modification**: Modifying files outside the project root during a session is forbidden.

> For lifecycle management rules, see [docs/context.md — Lifecycle Management](docs/context.md#lifecycle-management).
<!-- COMMON-CLAUDE:END -->

<!-- COMMON-CLAUDE:START -->
### 10. Custom Command Error Recovery
If a custom slash command or background script returns a non-zero exit code:
* **Don't bypass hooks**: Never attempt to run git commands with `--no-verify` to bypass the hook system unless under explicit, written user instruction.
* **Code Page / UTF-8 Issues (Windows)**: If broken Korean characters or Unicode errors appear in CLI output, the Windows terminal code page (CP949) is likely the cause. Ensure `$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8;` or `chcp 65001` is prepended to scripts.
* **Diagnostic Audit**: Immediately read the failure stdout log. Common errors include:
  * Missing staged `CHANGELOG.md` edits (caught by `pre-commit`). Fix by running `/changelog` and staging the file.
  * Direct push attempt to `main` (caught by `pre-push`). Fix by executing the `/sync` pipeline script which handles target branch generation and PR staging automatically.
<!-- COMMON-CLAUDE:END -->

<!-- COMMON-CLAUDE:START -->
### 11. Windows Platform Requirement

**Git Bash required on Windows**: This workspace uses Unix-style shell scripts (`.sh`) for `.githooks/` hook files. Windows users must have Git Bash installed and configured as the default shell for git hooks.

- Git Bash ships with [Git for Windows](https://gitforwindows.org/) — install if not present.
- Verify: `git config core.hooksPath` should point to `.githooks/`
- All `scripts/` operational scripts are TypeScript (`.ts`) — run via `bun scripts/<name>.ts`. No `.sh/.ps1` counterparts (ADR-0036).
- If a hook fails on Windows with "command not found", run it via Git Bash: `"C:\Program Files\Git\bin\bash.exe" .githooks/pre-commit`
<!-- COMMON-CLAUDE:END -->

<!-- COMMON-CLAUDE:START -->
## Git & PR Additions (Claude Code)

All shared Git/PR rules are in [docs/context.md](docs/context.md). Claude Code-specific additions:

- **PR Language**: Governed by [docs/context.md](docs/context.md). All PR titles, bodies, and review comments must be written in English - no exceptions.

*Last Updated: 2026-09-12 — removed redundant N-1/N boilerplate rows; /sync already covers lifecycle + audit + commit + push + PR; previous: 2026-06-21 inlined N-1/N rows*
<!-- COMMON-CLAUDE:END -->

---

## Session Start Checklist

<!-- Shared 5-step checklist (matches GEMINI.md Section 1) — platform overrides in each file -->

At the start of every Claude Code session, run this checklist:
*(Ref: `docs/context.md` -> `Initial Context Files`)*

```
0. git config core.hooksPath .githooks         # activate hooks (run once per clone)
1. Read docs/context.md                        # full architecture map, ABAP rules, workflow
2. Read AGENTS.md                              # canonical agent roster
3. Read memory/MEMORY.md                       # recent session history (skip if absent)
4. Read skills/abap-dev/SKILL.md               # SAP development workflows
5. Read skills/post-write-chain/SKILL.md       # mandatory QA chain after any write
```

---

## Claude Code: CLI vs Desktop App

Both the CLI and the Desktop App share the same configuration files and MCP server setup. Key differences, especially regarding hook behavior and UI features, are detailed in [docs/tooling-matrix.md](docs/tooling-matrix.md).

> **Hook limitation**: `PostToolUse` hooks configured in `.claude/settings.json` do **not** fire in the Desktop App. After any `WriteSource` / `EditSource`, run the Post-Write Mandatory Chain manually (see [skills/post-write-chain/SKILL.md](skills/post-write-chain/SKILL.md)) and sync via `bun scripts/dev-sync.ts`.

> **Linux developers**: Use CLI only — the Desktop App is not available on Linux.

---

## Claude Code Settings

- `.claude/settings.json` — shared team permissions (committed to repo; note that `.claude/` is a hidden dot-folder and may not show in standard listing tools by default)
- `.claude/settings.local.json` — personal write permissions + git operations (gitignored)
- `.claude/commands/` — slash commands (see §2 above)

Both files are loaded automatically. `enableAllProjectMcpServers: true` is set in the local file to activate the abap MCP server.

---

## Hooks

A `PostToolUse` hook fires after every `Write` or `Edit` tool call and runs `bun scripts/sync-md.ts`. This hook is defined in `.claude/settings.json`. `sync-md.ts` updates the `memory/MEMORY.md` index after every edit — this ensures session context is maintained in real-time.

### Desktop App Manual Post-Write Chain

When using Claude Code Desktop App, PostToolUse hooks do not fire. After any `WriteSource` or `EditSource`, run this chain manually:

```
1. bun scripts/sync-md.ts          # update memory index
2. SyntaxCheck(<object_url>)        # verify ABAP syntax
3. RunUnitTests(<object_url>)       # run unit tests
4. RunATCCheck(<object_url>)        # ATC quality check
5. bun scripts/dev-sync.ts "fix: description"  # sync & commit
```

See `skills/desktop-app-fallback/SKILL.md` for the complete fallback workflow.

---

*Last Updated: 2026-09-12 — resynced Claude Code-Specific Behaviors (§1-11) with the current
templates/common/CLAUDE.md baseline (Role Declaration, full Automated Hooks/Slash Commands/
Language Policy/Skill Resolution/Agent Dispatch/Plan Mode/Task Tracking sections had drifted
out of sync); consolidated the orphaned teammateMode block into §6; kept all ABAP-specific
content (Session Start Checklist, CLI vs Desktop App, Hooks, Desktop App Manual Post-Write
Chain) as the project-specific tail, matching the structure used across co-hr, co-safety, and
other co-* projects.*

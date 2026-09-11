# GEMINI.md

**vsp** — Go-native MCP server and CLI for SAP ABAP Development Tools (ADT).

> This file contains **Gemini-specific overrides only**.
> All shared dev context (build commands, codebase map, current priorities, common issues,
> ABAP rules, security) lives in [docs/context.md](docs/context.md) and applies to all AI tool sessions equally.
> Read `docs/context.md` first, then apply the overrides below.

---

## Role Declaration

You ARE the PM agent for this session. Load and follow [`agents/pm.md`](agents/pm.md) at all times.

**Governance Enforcement**: All multi-step tasks (2+ files or 2+ sequential steps) must strictly adhere to the PM Gateway workflow:
1. Display execution plan table first (task | agent | tier | model | platform)
2. Only then use `invoke_subagent` to dispatch specialist agents
3. Never bypass PM workflow — direct specialist invocation is forbidden

> **Note**: This Role Declaration and the Mandatory Execution Plan serve as the strict system-prompt-level enforcement for the PM Gateway.

---

## Gemini-Specific & Antigravity Workflows

### 1. Active Antigravity Tool Suite Mapping & Safeguards

| Tool Category | Tool Name | Operational Guidance |
| :--- | :--- | :--- |
| **File Reading** | `view_file` | Read up to 800 lines at a time. Supports absolute paths. |
| **File Creation** | `write_to_file` | Create new files. Supports `IsArtifact` and structured `ArtifactMetadata` block. |
| **Surgical Edit** | `replace_file_content` | Replace a single contiguous block of code. Specify `StartLine`, `EndLine`, `TargetContent`, and `ReplacementContent` with 100% exact leading whitespace matching. |
| **Multi Edit** | `multi_replace_file_content` | Perform multiple non-contiguous edits within the same file simultaneously. Order chunks descendingly (bottom-to-top) to avoid line offsets. |
| **Search** | `grep_search` | Search codebases via Ripgrep. Keep `MatchPerLine: true` for line-by-line matches. Apply partitioning if matches exceed 50. |
| **Command Execution** | `run_command` | Execute PowerShell/Bash shell commands. Returns task process IDs. NEVER use `cd` commands. 🚫 **STRICT BAN**: NEVER run `git commit` or `git push` directly via this tool. All commits must go through the approved `/sync` pipeline or `bun scripts/dev-sync.ts`. |

#### ⚠️ Surgical Multi-Replace Offset Safeguard
When calling `multi_replace_file_content` with multiple `ReplacementChunks`, the line numbers of subsequent target blocks will shift if previous edits change the line count.
- **Rule**: Sort and process `ReplacementChunks` from the **bottom of the file to the top** (descending order of line numbers: largest `StartLine` first).

#### ⚠️ Windows Terminal & Code Page Safeguard
When executing CLI commands via `run_command` on Windows (PowerShell/CMD), the default Windows code page (e.g., CP949) often causes Unicode decoding errors.
- **Rule:** Before running commands that output non-ASCII text, explicitly set the code page to UTF-8 by prepending `$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8;` (PowerShell) or `chcp 65001` (CMD).

#### ⚠️ Grep Search 50-Match Cap Safeguard
The `grep_search` tool silently truncates results at exactly **50 matches**.
- **Rule**: If a search yields 50 results, do **NOT** assume you have all occurrences.
- **Remediation**: Partition the search by targeting specific subdirectories or applying restrictive file glob filters via the `Includes` parameter (e.g., `["*.go"]`).

---

### 2. Planning Mode & Artifact Specifications
Enter Planning Mode for complex tasks or architectural modifications. Leverage these three Markdown artifacts (set `IsArtifact: true` with accurate metadata):

#### 1. `implementation_plan.md`
*Path: `<appDataDir>\brain\<session-id>\implementation_plan.md`*
- **Purpose**: Detailed technical design document presented to the user for feedback and approval.
- **Metadata**: `ArtifactType: "implementation_plan"`, `RequestFeedback: true`.
- **Governance**: Stop and wait for explicit user approval before modifying any code.

#### 2. `task.md`
*Path: `<appDataDir>\brain\<session-id>\task.md`*
- **Purpose**: Running TODO list to track development progress dynamically.
- **Metadata**: `ArtifactType: "task"`.
- **Syntax**: `- [ ]` uncompleted · `- [/]` in progress · `- [x]` completed.

#### 3. `walkthrough.md`
*Path: `<appDataDir>\brain\<session-id>\walkthrough.md`*
- **Purpose**: Post-implementation document summarizing changes, test logs, and manual validation details.
- **Metadata**: `ArtifactType: "walkthrough"`.

After changes are verified, summarize outcomes in `memory/YYYY-MM-DD.md` and update `CHANGELOG.md`.

---

### 3. Subagent Instantiation & Async Orchestration

> **Agent Architecture**: See [docs/context.md](docs/context.md) for governance rules.
> **Agent Roster**: See [AGENTS.md](AGENTS.md) for the canonical index of all available agents (e.g. `agents/co-analyst.md`).

#### Define Subagent (`define_subagent`)
```json
{
  "name": "abap-analyst",
  "description": "Read-only ABAP code analysis and dependency mapping",
  "system_prompt": "You are an ABAP code analyst...",
  "enable_write_tools": false,
  "enable_subagent_tools": false
}
```

#### Invoke Subagent (`invoke_subagent`)
```json
{
  "Subagents": [
    {
      "TypeName": "abap-analyst",
      "Role": "ABAP Analyst",
      "Prompt": "Analyze dependencies of ZPROG_SBOOK_QUERY in package $TMP"
    }
  ]
}
```

#### Communication (`send_message`)
Interact with spawned agents via their unique `conversationID`.
**Reactive Wakeup**: Do not poll in a loop — simply yield execution and the platform wakes you automatically when an agent replies or a background task completes.

#### Cost Optimization (3-Tier Model Strategy)
The High/Medium/Low tier concept and its usage rules are the Single Source of Truth in [AGENTS.md §3.6 3-Tier Strategy](AGENTS.md#36-3-tier-strategy). Gemini/Antigravity's model-ID mapping (overridden per subagent invocation when appropriate):
- **High-tier** (Design/Planning) → `gemini-3.1-pro` (Parameter: `thinking_level="medium"`)
- **Medium-tier** (Review/QA) → `gemini-3.7-flash` (no thinking parameter)
- **Low-tier** (Execution/Coding) → `gemini-3.7-flash` (no thinking parameter)

---

<!-- COMMON-GEMINI:START -->
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
<!-- COMMON-GEMINI:END -->

<!-- COMMON-GEMINI:START -->
## Execution Plan Boilerplate

The execution plan table format, the Design Gate (Row 0) rule, exemption categories, and the `/sync`-as-final-step rule are the Single Source of Truth in **[AGENTS.md §5.1 Standard Execution Plan Template](AGENTS.md#51-standard-execution-plan-template)** and **[§5.1.1 Design Gate Exemptions](AGENTS.md#511-design-gate-exemptions)** — do not restate them here.

> **Note (Antigravity-specific)**: Use the literal Gemini model ID (e.g. `gemini-3.1-pro`) in the `Model` column, not a Claude-style short alias.

**Antigravity execution**: Use `invoke_subagent` for specialist dispatch. See §3 (Subagent Instantiation & Async Orchestration) in this file.
<!-- COMMON-GEMINI:END -->

<!-- COMMON-GEMINI:START -->
### 6. Workspace & Template Boundary Policy

- **Strict CWD Isolation**: When modifying templates (in `templates/`), you MUST strictly limit your working directory (CWD) to the specific template folder.
- **No Cross-Modification**: Modifying workspace root files and template files in a single task or session is forbidden. Keep workspace root changes and template changes completely isolated.

> For L1-L2 Fork Model and lifecycle management rules, see [docs/context.md](docs/context.md) and [docs/context.md](docs/context.md).
<!-- COMMON-GEMINI:END -->

<!-- COMMON-GEMINI:START -->
## Git & PR Additions (Gemini)

All shared Git/PR rules are in [docs/context.md](docs/context.md). Gemini-specific additions:

- **Platform Hook Support**: Gemini CLI supports BeforeTool/AfterTool/PreCompress hooks (stdin(JSON) → stdout(JSON)). AfterTool runs `bun scripts/hooks/post-write-lifecycle-check.ts --platform gemini` after every write_file/replace_file_content/multi_replace_file_content. Antigravity does NOT fire hooks (VS Code extension limitation). Claude Desktop App uses bundled CLI (hooks should fire per Anthropic docs, but workspace testing observed intermittent behavior). If hooks are not firing in your environment, run `bun scripts/hooks/post-write-lifecycle-check.ts` manually before committing.
- **Commit Protection (SYNC_ACTIVE)**: Direct `git commit` or `git push` calls via `run_command` are **FORBIDDEN**. The pre-commit hook blocks direct commits unless executed through `/sync`. Never manipulate environment variables (e.g., `$env:SYNC_ACTIVE=1; git commit`) to bypass QA gates. If you see `[FAIL] Direct git commits are restricted`, run `/sync \"type: description\"` instead. **`--no-verify` is forbidden** — it bypasses secret scanning and all quality gates.
- **Sequential Branch Dependency Rule**: Before running `/sync` to open a new PR while a prior PR from the same session is still open and unmerged, merge the prior PR first (or explicitly justify parallel branching in a plan/design doc). `dev-sync.ts` touches shared pipeline files (CHANGELOG.md, memory logs, VERSION_MANIFEST.md, generated READMEs) on every commit, so unmerged parallel branches conflict by default, not by exception. Full rule: context.md §3.3.
- **PR Language**: Governed by [docs/context.md](docs/context.md). All PR titles, bodies, and review comments must be written in English - no exceptions.
- **Windows: Git Bash required**: `.githooks/` hook files are Unix shell scripts. Windows users must have Git Bash installed. Run `git config core.hooksPath .githooks` to activate hooks. All `scripts/` operational scripts are TypeScript (`.ts`) — run via `bun scripts/<name>.ts`. No `.sh/.ps1` counterparts (ADR-0036).
<!-- COMMON-GEMINI:END -->

<!-- COMMON-GEMINI:START -->
## Pre-Edit Quality Gate (All Platforms)

Before editing any file for the **FIRST time in a session**, the agent MUST:

1. Search for all files that import or require the target file
2. Identify data schemas, interfaces, and type definitions the file exports
3. Review the user's instructions for explicit scope constraints
4. Briefly summarize findings (1-3 sentences) before proceeding

| Platform | Enforcement | Details |
|----------|:-----------:|---------|
| Gemini CLI | ✅ Hook (automatic) | BeforeTool `deny` mode — blocked until agent investigates |
| Antigravity | ✅ Prompt (manual) | Hooks do not fire — agent self-enforces |

If the hook is not active (Antigravity), agents must still follow the 4-step process before making first edits.
<!-- COMMON-GEMINI:END -->

<!-- COMMON-GEMINI:START -->
### Custom Command Error Recovery
If a custom slash command or background script returns a non-zero exit code:
* **Don't bypass hooks**: Never attempt to run git commands with `--no-verify` to bypass the hook system unless under explicit, written user instruction.
* **Code Page / UTF-8 Issues (Windows)**: If broken Korean characters or Unicode errors appear in CLI output, the Windows terminal code page (CP949) is likely the cause. Ensure `$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8;` or `chcp 65001` is prepended to scripts.
* **Diagnostic Audit**: Immediately read the failure stdout log. Common errors include:
  * Missing staged `CHANGELOG.md` edits (caught by `pre-commit`). Fix by running `/changelog` and staging the file.
  * Direct push attempt to `main` (caught by `pre-push`). Fix by executing the `/sync` pipeline script which handles target branch generation and PR staging automatically.
<!-- COMMON-GEMINI:END -->

<!-- COMMON-GEMINI:START -->
### Windows Platform Requirement

**Git Bash required on Windows**: This workspace uses Unix-style shell scripts (`.sh`) for `.githooks/` hook files. Windows users must have Git Bash installed and configured as the default shell for git hooks.

- Git Bash ships with [Git for Windows](https://gitforwindows.org/) — install if not present.
- Verify: `git config core.hooksPath` should point to `.githooks/`
- All `scripts/` operational scripts are TypeScript (`.ts`) — run via `bun scripts/<name>.ts`. No `.sh/.ps1` counterparts (ADR-0036).
- If a hook fails on Windows with "command not found", run it via Git Bash: `"C:\Program Files\Git\bin\bash.exe" .githooks/pre-commit`
<!-- COMMON-GEMINI:END -->

---

## Session Start Checklist

<!-- Shared 5-step checklist (matches CLAUDE.md Section 1) — platform overrides in each file -->

Load project files at session start using the `@` syntax:
*(Ref: `docs/context.md` -> `Initial Context Files`)*

```
@docs/context.md                            # full project knowledge (ABAP rules, build, codebase map)
@AGENTS.md                                  # canonical agent roster
@memory/MEMORY.md                           # recent changes (skip if file does not exist)
@skills/abap-dev/SKILL.md                   # SAP development workflows
@skills/post-write-chain/SKILL.md           # mandatory QA chain after any write
```

---

## vsp MCP Configuration

### Recommended Mode

Use `--mode hyperfocused` for all Gemini sessions. In hyperfocused mode all 101 MCP operations are accessible via `sap_execute`; the single entry point reduces tool-selection hallucinations without restricting capability.

```bash
vsp mcp --mode hyperfocused
```

### Settings File

Gemini reads `.gemini/settings.json` in the project root. Confirm `mcpServers.abap.args`
contains `["--mode", "hyperfocused"]` before starting a session.

### Tool Usage in Hyperfocused Mode

All operations are routed through `sap_execute` with an `action` parameter:

```json
{ "action": "GetSource", "object_type": "PROG", "name": "ZPROG_SBOOK_QUERY" }
{ "action": "EditSource", "object_url": "/sap/bc/adt/...", "old_string": "...", "new_string": "..." }
{ "action": "GrepPackages", "packages": ["$TMP"], "pattern": "ZPROG_" }
```

See [docs/mcp_usage.md](docs/mcp_usage.md) for the full tool catalog and parameter reference.

---

## Gemini Skill Additions

The following capabilities extend those in [skills/abap-dev/SKILL.md](skills/abap-dev/SKILL.md):

- **Role-Based Execution**: Switch between Business and Technical roles defined in `AGENTS.md`
  by explicitly stating the active role at the start of a task.
- **Multi-Agent Coordination**: Delegate long-running research to background sessions;
  keep write operations (EditSource, WriteSource) in the primary session.
- **Advanced Diagnostics**: Use `vsp health` to validate architecture and
  `vsp slim` for context optimization before large read sessions.
- **Post-Write Test Chain**: Hooks are not supported. After any write operation, execute the mandatory chain manually via `sap_execute` as defined in `docs/context.md`.
  ```json
  { "action": "SyntaxCheck",   "object_url": "/sap/bc/adt/..." }
  { "action": "RunUnitTests",  "object_url": "/sap/bc/adt/..." }
  { "action": "RunATCCheck",   "object_url": "/sap/bc/adt/..." }
  ```

> **Common engineering rules** (memory logging, language, file isolation, post-write chain, git): [docs/context.md § Project-Wide Rules](docs/context.md#project-wide-rules-all-tools).

---

## Coexistence, Precedence & Migration of `.claude/`

This project contains a `.claude/` directory. To prevent configuration drift and avoid issues when transitioning away from Claude Code, Gemini follows these rules:
- **Absolute Precedence**: `.gemini/` always takes absolute precedence over `.claude/`. If `.gemini/` exists, `.claude/` is ignored by Gemini to prevent duplicate or conflicting configurations.
- **Fallback (Coexistence Phase)**: If a project lacks a `.gemini/` directory but contains `.claude/`, Gemini will temporarily read and respect `.claude/settings.json`, `.claude/settings.local.json`, and `.claude/commands/` as the fallback source of truth.
- **Command Emulation**: Custom slash commands defined as markdown files in `.claude/commands/` must be emulated by Gemini. Read the `.md` file to understand the underlying script execution and run those commands directly via terminal tools.

---

*Last Updated: 2026-08-28 — resynced Gemini-Specific & Antigravity Workflows with the current
templates/common/GEMINI.md baseline (Role Declaration, Language Policy, Execution Plan
Boilerplate, Git & PR Additions, Pre-Edit Quality Gate had drifted out of sync — only 1 of 4
COMMON-GEMINI markers remained); kept all vsp/ABAP-specific content (Session Start Checklist,
vsp MCP Configuration, Gemini Skill Additions, `.claude/` coexistence) as the project-specific
tail, matching the structure used across co-hr, co-safety, and other co-* projects. Companion
fix to the CLAUDE.md correction (PR #102).*

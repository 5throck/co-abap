# Antigravity MCP Setup Guide

The Antigravity IDE reads the project-level `.agents/mcp.json`, which launches the `abap` server through `scripts/sap-mcp-proxy.ts` (to be confirmed on-device: item V9 in the [parity design](designs/2026-10-10-cross-platform-parity-design.md)). The Antigravity CLI (`agy`) config path and MCP format are not yet verified (item V8); until then, use the IDE or the fallback dispatcher `bun scripts/dispatch-parallel.ts --platform antigravity-cli --plan <file>`.

> **Important**:
> - SAP safety is enforced by the proxy, not by hooks. `ask` calls return `APPROVAL_REQUIRED id=<id>`; a human runs `bun scripts/sap-approve.ts <id>` in their own terminal, then the agent repeats the identical call. Agents never run `sap-approve.ts`.
> - Antigravity does **not** fire hooks. Run the Post-Write chain (`/post-write`) after every ABAP code change; the proxy records the evidence.
> - Never point an MCP entry at `vsp` directly — the parity validator (`bun scripts/validate-platform-parity.ts`) rejects it.

---

## 1. Prerequisites

- VS Code installed and running
- Antigravity extension installed and activated
- `vsp` binary present at `C:\Users\<your-username>\abap\vsp.exe` (Windows) or `~/abap/vsp` (macOS/Linux)
- `.env` file configured at the repository root (`C:\Users\<your-username>\abap\.env`)

---

## 2. Registering the MCP Servers

MCP servers for the Antigravity IDE come from the tracked project file `.agents/mcp.json`. The `abap` entry must route through the proxy:

```json
{
  "mcpServers": {
    "abap": {
      "command": "bun",
      "args": ["scripts/sap-mcp-proxy.ts", "--", "--mode", "hyperfocused"]
    }
  }
}
```

The proxy resolves the project root and the `vsp` binary absolutely and loads its own `.env`, so no SAP credentials or package allowlist belong in this file. If you must register servers at the **user** level in VS Code settings (`antigravity.mcpServers`), use the same proxy command with the absolute path to `scripts/sap-mcp-proxy.ts`.

> **Absolute paths**: when a client starts the server without the project as working directory, use `bun /absolute/path/to/co-abap/scripts/sap-mcp-proxy.ts -- --mode hyperfocused`.

---

## 3. Credentials and Environment Variables

**Credential storage standard** (applies to every setup guide and config in this repo):

1. **Preferred: `.env` in the project root.** Create it with mode `600` (`chmod 600 .env`). It is gitignored; `.env.sample` lists the keys with placeholder values only.
2. **Alternative: OS keychain** (macOS Keychain, Windows Credential Manager, or `secret-tool` on Linux), read into the session at launch.

Do **not** store `SAP_PASSWORD` in shell profiles (`~/.bashrc`, `~/.zshrc`), in Windows user environment variables, in `.gemini/settings.json`, or in any tracked config file. Those locations are readable by other processes and are easy to commit by accident.

`vsp` reads SAP connection details from environment variables. If Antigravity does not load the `.env` file automatically, keep the password out of the MCP config and inject it at launch from `.env` or the keychain. Put any local-only overrides in the gitignored `.mcp.local.json`, never in the tracked `.gemini/settings.json`. Restart VS Code after changing credentials.

---

## 4. Verification

After restarting VS Code, open the Antigravity chat panel and run:

```
Show SAP system info
```

A successful response displays the system ID, client number, and logged-in user. If you see an error, confirm the `vsp` binary path and that the environment variables are visible to VS Code's process.

---

## 5. No-Hook Workaround: Manual Post-Write Chain

Antigravity does not fire `PostToolUse` hooks. After any ABAP code change, **always run the following three steps manually** before considering the task complete:

| Step | Tool | Pass Condition |
|------|------|---------------|
| 1 | syntax check (`SAP(action=analyze, type=syntax_check)`) | 0 errors |
| 2 | unit tests (`SAP(action=test)`) | 0 failures |
| 3 | ATC (`SAP(action=test, type=atc)`) | 0 Priority-1 findings |

You can trigger these by asking Antigravity directly, or by switching to Claude Code CLI and running `/post-write <ObjectName>`.

For Git commit and memory sync, use the terminal manually:

```bash
bun scripts/dev-sync.ts "feat: summary of change"
```

---

## 6. Custom Commands & Skills

Antigravity shares `.gemini/commands/` for slash command definitions and discovers skills from `.agents/skills/` (shortcut skills) and `skills/` (L0 SSOT). The three core process skills are:

### `/sync` — Full Project Sync Pipeline

```bash
bun scripts/dev-sync.ts "feat: summary of change"
```

The script handles: memory log → CHANGELOG → audit → sensitive guard → commit/push/PR.

> Antigravity does not auto-register slash commands. Ask Antigravity to run the above script, or paste the command directly.

### `/project-review` — Comprehensive Project Review

Read `skills/project-review/SKILL.md` and follow the 5-step procedure:
1. Detect project context (scan `agents/` for available agents)
2. Generate execution plan (map agents to review domains)
3. **Antigravity uses `/meeting` dialogue mode** — agents speak in turn sequentially (no parallel dispatch)
4. Synthesize results into prioritized tables (Critical/High/Moderate/Low)
5. Generate action items with owner, deliverable, priority

> **Antigravity limitation**: Cannot dispatch agents in parallel like Claude Code. Uses inline sequential dialogue via `/meeting` instead.

### `/meeting` — Multi-Agent Meeting Facilitation

```bash
/meeting "meeting topic" --agents agent1,agent2 --rounds 2 --language ko --dialogue
```

Full 8-step framework: define parameters → detect agents → open structure → conduct rounds → synthesize → archive transcript → close meeting → optional task conversion.

Read the complete procedure in `.gemini/commands/meeting.md` (351 lines).

### Skill Distribution

Skills are distributed from `skills/` (L0 SSOT) to all platform directories by `scripts/sync-skills.ts`:

```
skills/ (L0) ──► .claude/skills/   (Claude Code)
              ──► .gemini/skills/   (Gemini CLI / Antigravity)
              ──► .agents/skills/   (Antigravity shortcuts)
```

After editing any skill in `skills/`, run `bun scripts/sync-skills.ts` to propagate changes.

---

## 7. Platform Comparison

The full 8-platform matrix is in [tooling-matrix.md](tooling-matrix.md). Antigravity summary:

| Capability | Antigravity IDE | Antigravity CLI |
|------------|:---------------:|:---------------:|
| `abap` via proxy | ✅ `.agents/mcp.json` (verify V9) | pending V8 |
| Hooks | ❌ | pending V8 |
| Post-Write chain | `/post-write`; proxy records evidence | same |
| Parallel agent dispatch | Agent Manager | pending V8; fallback `dispatch-parallel.ts --platform antigravity-cli` |

---

*Last Updated: 2026-10-10*

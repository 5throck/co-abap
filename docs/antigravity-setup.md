# Antigravity MCP Setup Guide

Antigravity 2.0 (and the Antigravity CLI) now supports project-level configurations through the `.gemini/settings.json` file. This means the MCP servers and tools can be configured for the entire project and shared among the team. For legacy versions or user-specific overrides, MCP servers can still be registered manually at the **user level** in VS Code settings.

> **Important**:
> - Antigravity does **not** support `PostToolUse` hooks. You must run the Post-Write chain (`/post-write`) manually after every ABAP code change.

---

## 1. Prerequisites

- VS Code installed and running
- Antigravity extension installed and activated
- `vsp` binary present at `C:\Users\<your-username>\abap\vsp.exe` (Windows) or `~/abap/vsp` (macOS/Linux)
- `.env` file configured at the repository root (`C:\Users\<your-username>\abap\.env`)

---

## 2. Registering the MCP Servers

MCP servers for Antigravity are registered in VS Code's **user** `settings.json`.

**Open VS Code user settings (JSON):**
- Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) → `Preferences: Open User Settings (JSON)`

**Add the following block:**

```json
{
  "antigravity.mcpServers": {
    "abap": {
      "command": "C:\\Users\\<your-username>\\abap\\vsp.exe",
      "args": ["--mode", "hyperfocused"],
      "env": {
        "SAP_MODE": "hyperfocused",
        "SAP_ALLOWED_PACKAGES": "Z*,$TMP,$ZADT_VSP,$VSP_ADT",
        "SAP_FEATURE_ABAPGIT": "on",
        "SAP_FEATURE_TRANSPORT": "on",
        "SAP_FEATURE_UI5": "on",
        "SAP_FEATURE_RAP": "on"
      }
    },
    "abap-docs": {
      "type": "http",
      "url": "https://mcp-abap.marianzeis.de/mcp"
    },
    "sap-docs": {
      "type": "http",
      "url": "https://mcp-sap-docs.marianzeis.de/mcp"
    }
  }
}
```

> **macOS / Linux**: Replace the `command` path with the absolute path to the `vsp` binary in your local clone, e.g. `/home/<username>/abap/vsp`.

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
| 1 | `SyntaxCheck` | 0 errors |
| 2 | `RunUnitTests` | 0 failures |
| 3 | `RunATCCheck` | 0 Priority-1 findings |

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

| Capability | Claude Code CLI | Claude Code App | Gemini CLI | Antigravity |
|------------|:---------------:|:---------------:|:----------:|:-----------:|
| MCP auto-connect | ✅ | ✅ | ✅ | ✅ (manual reg.) |
| PostToolUse hook | ✅ | ❌ | ❌ | ❌ |
| Post-Write chain | Automatic | Manual (`/post-write`) | Manual | Manual |
| Git commit | `/sync` | `/sync` | Manual | Manual |
| Custom commands | ✅ (19 commands) | ✅ (19 commands) | ⚠️ Emulated | ⚠️ Emulated |
| Parallel agent dispatch | ✅ `Agent` tool | ✅ `Agent` tool | ❌ Sequential | ❌ Sequential |
| Project-level config | ✅ `.mcp.json` | ✅ `.mcp.json` | ✅ `.gemini/settings.json` | ✅ `.gemini/settings.json` |

---

*Last Updated: 2026-10-10*

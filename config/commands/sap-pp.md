---
name: sap-pp
description: Load SAP PP (Production Planning) module analyst context ??BOM, routing, production orders, MRP, and work center management. Use when working on PP module tasks or activating the PP Analyst role.
argument-hint: ""
allowed-tools: ["mcp__abap__SAP"]
---

Load and apply the PP module skill from `skills/sap-pp/SKILL.md`.

Read the file at `skills/sap-pp/SKILL.md` now and hold all domain knowledge (process flows, table relationships, query patterns, BAPIs, quirks) as active session context.

After reading, confirm: "PP Analyst skill loaded ??PP module context active."

SAP access: vsp runs in hyperfocused mode, so use the single `mcp__abap__SAP` tool as `SAP(action, target, params)` (e.g. `read`, `query`, `search`, `analyze`). Legacy-name mapping: [vsp Tool Reference](../../docs/co-abap.context.md#vsp-tool-reference-hyperfocused-mode).

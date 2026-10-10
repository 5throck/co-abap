---
name: sap-sd
description: Load SAP SD (Sales & Distribution) module analyst context ??sales orders, deliveries, billing, pricing, and order-to-cash processes. Use when working on SD module tasks or activating the SD Analyst role.
argument-hint: ""
allowed-tools: ["mcp__abap__SAP"]
---

Load and apply the SD module skill from `skills/sap-sd/SKILL.md`.

Read the file at `skills/sap-sd/SKILL.md` now and hold all domain knowledge (process flows, table relationships, query patterns, BAPIs, quirks) as active session context.

After reading, confirm: "SD Analyst skill loaded ??SD module context active."

SAP access: vsp runs in hyperfocused mode, so use the single `mcp__abap__SAP` tool as `SAP(action, target, params)` (e.g. `read`, `query`, `search`, `analyze`). Legacy-name mapping: [vsp Tool Reference](../../docs/co-abap.context.md#vsp-tool-reference-hyperfocused-mode).

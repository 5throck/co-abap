---
name: post-write
description: Run the Post-Write quality gate chain (SyntaxCheck ??RunUnitTests ??GetCodeCoverage ??RunATCCheck) for the specified ABAP object. Use after any WriteSource or EditSource operation in Desktop App or Antigravity where hooks do not fire automatically.
argument-hint: "<object-name>"
allowed-tools: ["mcp__abap__SAP"]
gemini-parity: skip # intentional Claude-only command
---

Load and apply the full Post-Write Mandatory Chain from `skills/post-write-chain/SKILL.md`.

Read the file at `skills/post-write-chain/SKILL.md` now and follow all instructions within it.

Chain via the single `mcp__abap__SAP` tool (mapping: [vsp Tool Reference](../../docs/co-abap.context.md#vsp-tool-reference-hyperfocused-mode)):
1. `SAP(action="analyze", params={"type":"syntax_check", ...})`
2. `SAP(action="test", params={"object_url":"...", "with_coverage":true})`
3. `SAP(action="test", params={"type":"atc", ...})`

The object to run the chain on is: $ARGUMENTS

If $ARGUMENTS is empty, ask the user which object was last modified.

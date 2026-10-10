---
name: post-write-chain
description: 'Use after ANY WriteSource, EditSource, or Activate operation on SAP ABAP objects. Enforces the mandatory quality gate: SyntaxCheck → RunUnitTests → GetCodeCoverage → RunATCCheck. Trigger automatically after every ABAP write operation.'
version: 1.3.1
last_reviewed: 2026-10-10
status: active
scope: co-abap
owner: test-runner
prerequisites: vsp MCP server
metadata:
  type: core
  triggers:
    - post-write-chain
    - WriteSource
    - EditSource
    - Activate
---

> ⚠️ **Desktop App**: `PostToolUse` hooks do **not** fire automatically. Run `/post-write <object-name>` **manually** after every WriteSource or EditSource in Desktop App sessions.

# Post-Write Mandatory Chain

Applies to all tools: **Claude Code CLI, Antigravity, Gemini CLI**

After ANY `WriteSource` / `EditSource` / `Activate`, the executing agent MUST run these four steps in order:

| Step | Tool | Pass Condition |
|------|------|----------------|
| 1 | `SyntaxCheck` | 0 errors |
| 2 | `RunUnitTests` | 0 failures |
| 3 | `GetCodeCoverage` | ≥ 70% statement coverage on the changed object (new objects); no regression vs. prior run (existing objects) |
| 4 | `RunATCCheck` | 0 Priority-1 findings |

## ATC Priority Levels

- **Priority 1 (Error)** → BLOCKS deployment — fix before `Activate`
- **Priority 2 (Warning)** → PM review required before proceeding
- **Priority 3 (Info)** → Log to task file only

## Code Coverage Gate (Step 3)

- **New objects** (class/program created this task): minimum **70%** statement coverage. Below threshold → write additional ABAP Unit tests before proceeding to `RunATCCheck`.
- **Existing objects** (modified, not created): coverage must not regress below the value recorded in the last QA report (`deliverables/REQ-NNN-*/04_qa_report.md` if tracked, else `memory/` log) for that object. A drop is treated the same as a coverage-threshold miss.
- **Disposition when coverage cannot reach 70%** (e.g. generated/boilerplate code, trivial getters): QA Engineer may waive with an explicit justification recorded in the QA report / memory log — never silently skip.
- Coverage is informational-only for GUI Scripter (BDC/VBS) objects, which `GetCodeCoverage` does not instrument.

## Output Format

Report each step result clearly:

```
✅ SyntaxCheck — PASSED
✅ RunUnitTests — PASSED (N tests, 0 failures)
✅ GetCodeCoverage — PASSED (82% statement coverage, threshold 70%)
✅ RunATCCheck — PASSED (0 Priority-1, 0 Priority-2, N Priority-3)
```

If any step fails:

```
❌ SyntaxCheck — FAILED
  Error: <error message>
  Line: <line number>
Action required: Fix the syntax error before proceeding.
```

```
❌ GetCodeCoverage — FAILED (54% statement coverage, threshold 70%)
Action required: Add ABAP Unit test cases covering the uncovered branches,
                  or record a waiver with justification in the QA report.
```

## Rules

1. Never skip SyntaxCheck — even for "trivial" one-line changes.
2. If SyntaxCheck fails, fix the code and re-run before proceeding to RunUnitTests.
3. If RunUnitTests fails, do not run GetCodeCoverage or RunATCCheck until the test logic is fixed.
4. If GetCodeCoverage falls below threshold (or regresses on an existing object) without a recorded waiver, do not proceed to RunATCCheck.
5. Priority-1 ATC findings block all further steps including transport release.
6. In Gemini / Antigravity sessions: route all four steps through the `SAP` tool per the [vsp Tool Reference](../../docs/co-abap.context.md#vsp-tool-reference-hyperfocused-mode) (SSOT): `SAP(action="analyze", params={"type":"syntax_check", ...})`, `SAP(action="test", ...)` for unit tests (with `with_coverage=true` for coverage), and `SAP(action="test", params={"type":"atc", ...})`.

## Enforcement

- **Hook-capable environments (Claude Code CLI)**: the `sap-action-audit` hook records each chain step's result as evidence in `memory/audit/sap-evidence.json` (object status `pending` after a write, `passed` once all four steps pass after that write, `failed` otherwise). `ReleaseTransport` is denied unless every object in the transport has `passed` evidence. Do not edit the evidence file by hand.
- **Manual profile (`HARNESS_PROFILE=manual`)**: no hook records evidence. Run the chain by hand with `/post-write`, and report the results in the task or QA report. **Transport release is blocked** in this profile; release only from the hooked CLI profile.
- Following this skill is a process rule for the agent. Only the hook-recorded evidence and the transport release gate are enforced controls (see [SECURITY.md](../../SECURITY.md#control-tiers)).

## Claude Code Desktop App Note

`PostToolUse` hooks do **not** fire automatically in the Desktop App. Run all three steps of this chain manually after each write in Desktop sessions using `/post-write <object-name>`.

## Context

This skill enforces a mandatory four-step quality gate that runs after every ABAP write operation (WriteSource, EditSource, or Activate). The chain ensures that no modified object reaches a transport request or production without passing syntax validation, unit tests, code coverage thresholds, and ATC checks. It is the primary safeguard against regressions in the ABAP development workflow.

## When to Use

- After any `WriteSource`, `EditSource`, or `Activate` operation on SAP ABAP objects
- Automatically triggered by PostToolUse hooks in CLI sessions
- Manually invoked via `/post-write <object-name>` in Claude Code Desktop App sessions
- Before releasing a transport request

## Execution Steps

1. **SyntaxCheck** — Run syntax validation on the modified object. Must return 0 errors to proceed.
2. **RunUnitTests** — Execute all ABAP Unit tests for the object. Must return 0 failures to proceed.
3. **GetCodeCoverage** — Measure statement coverage. New objects require 70% minimum; existing objects must not regress below prior baseline.
4. **RunATCCheck** — Execute ABAP Test Cockpit checks. Priority-1 findings block deployment.
5. If any step fails, fix the issue and re-run from the failed step. Do not skip forward.

## UI5 / Fiori Branch

For objects under a Fiori / UI5 app, run these in addition to (not instead of) the backend chain:

1. **ui5-linter** - zero errors (deprecated API, global usage).
2. **QUnit / OPA5** - unit and integration tests pass.
3. **manifest validation** - `manifest.json` checks (ids, data sources to `_O4`/`_O2`, `minUI5Version`, routing, i18n).
4. **accessibility-audit** - WCAG 2.1 AA via [accessibility-audit](../accessibility-audit/SKILL.md); Critical/Serious violations block handoff.

See [fiori-rap-dev](../fiori-rap-dev/SKILL.md) for details.

## RAP Artifacts

BDEF, SRVD, and DDLX: run `syntax_check` and activation (R2). SRVB publish is R3 and needs approval; it is not part of the automated chain. Behavior pool classes (`ZBP_R_`) follow the full four-step chain.

## Related Skills

- [abap-dev](../abap-dev/SKILL.md) — Core ABAP development workflows including unit testing and performance analysis
- [desktop-app-fallback](../desktop-app-fallback/SKILL.md) — Manual QA chain for Desktop App sessions where hooks do not fire
- [performance-tuning](../performance-tuning/SKILL.md) — Deep performance analysis for slow programs and expensive SQL
- [fiori-rap-dev](../fiori-rap-dev/SKILL.md) — Fiori / RAP workflow that uses the UI5 branch above

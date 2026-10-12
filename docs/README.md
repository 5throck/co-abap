# Project Documentation

Process, governance and reference documentation for the workspace itself.
Requirement **deliverables** (SRS, technical design, implementation/QA reports, user manuals)
do **not** live here — they go to [`deliverables/REQ-NNN-*/`](../deliverables/index.md),
built from [`deliverables/templates/`](../deliverables/templates/).

## Layout

### Root-level anchors (heavily cross-linked — move only with link updates)

| File | Purpose |
|------|---------|
| `context.md` | SSOT for all AI tools — architecture, workflow, coding rules |
| `co-abap.context.md` | co-abap specifics incl. VSP tool reference (hyperfocused mode) |
| `tooling-matrix.md` | Per-platform tooling and abap MCP parity matrix |
| `VERSION_MANIFEST.md` | Declared SSOT for skill versions and lifecycle status |
| `phase-definitions.md` | Phase / stage ownership model (Stages 1–5) |
| `security.md` | Security policies and reporting |
| `mcp_usage.md` | abap MCP server usage guide |

### Subdirectories

| Directory | Contents |
|-----------|----------|
| `adr/` | Architecture Decision Records (`NNNN-title.md`) |
| `designs/` | Design-gate design documents (`YYYY-MM-DD-<slug>-design.md`); registered in `specs/` |
| `specs/` | Spec registry — `registry.json` is a generated projection of `entries/*.json` (maintained by `scripts/spec-register.ts`, do not hand-splice) |
| `governance/` | Governance workflow docs (`agents/pm-gateway-workflow.md`, `agents/workflows.md`, `agents/execution-plan-templates.md`) |
| `standards/` | Development standards: `abap-dev-rules.md`, `clean-abap-checklist.md`, `testing-guidelines.md`, `transport-release-checklist.md`, `llm-interaction-standard.md` |
| `platform-setup/` | Setup guides: `setup-guide.md`, `antigravity-setup.md`, `plugin-setup.md`, `antigravity.md`, `hermes.md` |
| `lifecycle/` | Lifecycle documents |
| `decisions/` | Decision records (`DEC-YYYYMMDD-NN.md`) |
| `reports/` | Point-in-time review/audit reports |
| `superpowers/` | Superpowers skill documentation |

### Generated files — do not hand-edit

- `skill-graph.json`, `skill-graph.md`, `skill-graph.overrides.json` — rebuilt by `scripts/generate-skill-graph.ts`
- `README.md` / `README_ko.md` at repo root — maintained through the sync pipeline (this file pairs with `README.template.md` / `README_ko.template.md`)

### Document templates

`prd-template.md`, `task-template.md`, `handoff-spec.md` (+`_ko`), `components.template.md`,
`screen-patterns.template.md`, `design-tokens.template.css`, `README.template.md`,
`README_ko.template.md`, `skill.md` — copy as starting points for new documents.
Requirement-scoped document templates live in `deliverables/templates/`.

## Architecture Decision Records (ADR)

ADRs document significant architectural decisions with context, decision, consequences and
alternatives considered. Existing files under `adr/` double as worked examples.

### Lifecycle

| Status | Meaning |
|--------|---------|
| Proposed | Under consideration |
| Accepted | Current approach |
| Deprecated | No longer recommended |
| Superseded | Replaced by a newer ADR |

## Requirement deliverables (outside this directory)

User-facing requirement outputs follow the RTM workflow:

1. Scaffold: `bun scripts/co-abap/new-requirement.ts "<Title>" --module <SD|MM|FI|CO|PP|LE|CROSS>`
2. Produce the full standard set from `deliverables/templates/`: `01_srs.md`, `02_technical_design.md`,
   `03_implementation_report.md`, `04_qa_report.md`, `05_unit_test_plan.md`, `06_release_report.md`
   (plus the user manual pair `07_user_manual.md` / `07_user_manual_ko.md`) — create every
   applicable document even when the request does not name it explicitly.
3. Trace progress in [`deliverables/index.md`](../deliverables/index.md).

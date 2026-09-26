---
content_hash: 74449b0a33b775737ba3f0844d1db5594570ae36782c64c90495da2489dff8e2
---
# Harness Engineering for SAP ABAP

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green)](https://modelcontextprotocol.io)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Ready-blue)](https://claude.com/claude-code)

## Project Mission

This project is the core **Reference Implementation** of Harness Engineering. It aims to revolutionize SAP ABAP development by establishing a robust **Harness Engineering** framework. It leverages AI agents to automate, standardize, and optimize the entire development lifecycle - from business requirements analysis to system deployment.

## Harness Engineering Concept

**Harness Engineering** is a methodology where specialized AI agents collaborate within a strictly structured "harness" (environment). This approach ensures that AI-driven development is predictable, professional, and highly efficient.

Key principles of Harness Engineering include:
- **Document-First Approach**: All architectural decisions, workflows, and business rules are documented before any code is written.
- **Role-Based Collaboration**: Tasks are delegated to specialized agents (PM, Analysts, Developers, Architects) operating under a unified governance model, much like a human software engineering team.
- **Repository as a Brain**: While ABAP source code resides directly within the SAP system, this repository tracks the **intelligence, logic, and architectural framework** (the Harness) used by AI agents to manage the SAP environment.

---

## 🚀 Quick Start

1. **[Install prerequisites](docs/setup-guide.md)** - MCP server, SAP ADT access, abapGit
2. **Explore [AGENTS.md](AGENTS.md)** - Understand agent roles and workflows
3. **Run `/triage`** - Start your first task with automatic agent dispatch

---

## System Architecture & Operating Principles

The system operates as a bridge between modern AI interfaces and SAP environments:

1. **Agent Tier**: AI agents (Claude Code CLI, Gemini CLI, Antigravity, Codex CLI, Hermes Agent) act as the "brain," orchestrating tasks based on predefined Harness roles.
2. **Protocol Tier**: Standardized protocols (such as Model Context Protocol) are used to safely expose SAP ADT (ABAP Development Tools) capabilities to the agents.
3. **SAP Tier**: Direct interaction with SAP systems via REST APIs and WebSockets for stateful operations like debugging, query execution, and object management.

## Agent Framework (AGENTS.md)

AI agents operate under a **PM-led Governance** model, categorized into two strategic groups:

- **🏢 Business Group**: PM and Module Analysts (SD, MM, FI, CO, PP, LE) who translate business needs into technical requirements.
- **🛠️ Technical Group**: Architects, Developers, DBA, QA, and specialized experts (Fiori, Forms, GUI, Interfaces) who implement and verify the solution.

### Agent Roles

| Agent | Group | Phase | Parallelizable |
|-------|-------|-------|:--------------:|
| pm | Business | 1 | Serial |
| sd/mm/fi/co/pp/le-analyst | Business | 1 | Parallel |
| sap-investigator | Technical | 1 | Parallel |
| read-only-analyst | Technical | 1 | Parallel |
| schema-inspector | Technical | 1 | Parallel |
| architect | Technical | 2 | Serial |
| dba | Technical | 2 | Parallel |
| interface-expert | Technical | 2 | Parallel |
| code-writer | Technical | 2 | Serial |
| fiori-developer | Technical | 2 | Design parallel / write serial |
| form-expert | Technical | 2 | Design parallel / write serial |
| gui-scripter | Technical | 2 | Serial |
| test-runner | Technical | 3 | Serial after write |
| devops-admin | Technical | 4 | Serial |
| security-monitor | Technical | 0, 5 | Serial |
| i18n-specialist | Support | — | Serial |

For detailed roles, trigger keywords, and handoff protocols, see [AGENTS.md](AGENTS.md).

## Core Documentation

| File | Purpose |
| :--- | :--- |
| **[AGENTS.md](AGENTS.md)** | Roles, collaborative workflow, and subagent dispatch protocols. |
| **[docs/context.md](docs/context.md)** | **Shared** project context: build commands, codebase map, and development rules. |
| **[skills/abap-dev/SKILL.md](skills/abap-dev/SKILL.md)** | Specialized AI skills (BAPI explorer, memory intelligence) and QA chains. |
| **[docs/setup-guide.md](docs/setup-guide.md)** | Step-by-step environment setup (MCP, SAP, abapGit). |
| **[docs/user-guide.md](docs/user-guide.md)** | Task-level guide — how to hand SAP work to the agent team (한국어: [user-guide_ko.md](docs/user-guide_ko.md)). |
| **[deliverables/index.md](deliverables/index.md)** | Requirements Traceability Matrix (RTM) — Stage 1–5 tracking for every requirement. |
| **[SECURITY.md](SECURITY.md)** | Vulnerability reporting and the MCP-driven SAP access threat model. |
| **[memory/MEMORY.md](memory/MEMORY.md)** | Index of development history and architectural decisions. |

## Operational Workflow

The project follows a standardized **6-step Harness Engineering workflow**:

1. **Triage & Research** → 2. **Business Analysis** → 3. **Governance Approval** → 4. **Technical Design** → 5. **Implementation & Verification** → 6. **Finalization**

For the detailed execution sequence, see [AGENTS.md § Collaborative Workflow](AGENTS.md#agent-coordination-workflow-harness-advanced).

### Example Workflow

```bash
# Start with triage - automatically detects module and dispatches agents
/triage Fix the SD billing report for customer 1000

# Agents collaborate in phases:
# Phase 1: sap-investigator + read-only-analyst + schema-inspector (parallel)
# Phase 2: architect designs → code-writer implements
# Phase 3: test-runner verifies (SyntaxCheck → RunUnitTests → GetCodeCoverage → RunATCCheck)
# Phase 4: transport release + git sync
```

New functional scope gets a formal Requirements Traceability Matrix entry automatically:

```bash
bun scripts/new-requirement.ts "New Pricing Rule" --module SD --owner "SD Analyst"
# Scaffolds deliverables/REQ-NNN-slug/ (01_srs.md, 05_unit_test_plan.md, 06_release_report.md)
# and registers the RTM row (Stage 1 / Draft)
```

---

> [!TIP]
> **New to this project?** Start with [docs/setup-guide.md](docs/setup-guide.md) - step-by-step environment setup (includes MCP connectivity, abapGit, and AI agent configuration).

---

## Scripting (Bun / TypeScript)

All project scripts are implemented in **TypeScript (`.ts`)** and executed via **Bun** — no shell script pairing or cross-platform wrappers needed.

See `scripts/README.md` for complete documentation.

### Prerequisites for Agent Orchestration

**Windows:**
```powershell
powershell -c "irm bun.sh/install.ps1"
```

**macOS / Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

### Usage

```bash
# Project Scripts (Requires Bun)
bun scripts/dev-sync.ts "feat: description"
bun scripts/audit.ts
bun scripts/dispatch.ts parallel
bun scripts/verify-skills.ts
bun run typecheck   # tsc --noEmit over scripts/
bun run test        # bun test scripts/
```

---

## Quality Gates

Run this deterministic local closeout baseline:

```bash
bun run typecheck
bun run test
bun scripts/review-baseline.ts --quiet
bun scripts/audit.ts
bun scripts/validate-docs-links.ts --all
gitleaks git --no-banner
git diff --check
```

| Gate | Local command | CI status |
| :--- | :--- | :--- |
| Typecheck | `bun run typecheck` | `Typecheck` job |
| Script tests | `bun run test` | `Script Tests` job |
| L3 review baseline | `bun scripts/review-baseline.ts --quiet` | Local deterministic baseline; L0-only checks are explicit N/A |
| Documentation audit | `bun scripts/audit.ts` | `Documentation Audit` job |
| Link validation | `bun scripts/validate-docs-links.ts --all` | Run locally after documentation changes |
| Secret scan | `gitleaks git --no-banner` | `Secret Scan` job |

CI uses pinned Bun `1.4.2`; the secret-scan job uses a digest-pinned gitleaks image.
The table describes configured gates and does not assert that a GitHub Actions run has
been observed.

SAP-side, the same discipline applies after every `WriteSource`/`EditSource` via the
[Post-Write Mandatory Chain](skills/post-write-chain/SKILL.md): `SyntaxCheck` → `RunUnitTests` →
`GetCodeCoverage` (≥70% on new objects) → `RunATCCheck` (zero Priority-1 findings).

---

## Community

- 🐛 [Report Issues](https://github.com/5throck/co-abap/issues)
- 💡 [Feature Requests](https://github.com/5throck/co-abap/discussions)

---

## Related Documentation

- [Plugin Distribution](https://github.com/5throck/co-abap_plugin) - Ready-to-use Claude Code plugin
- [Agent Roles](AGENTS.md) - Complete agent catalog and workflows
- [Setup Guide](docs/setup-guide.md) - Environment configuration
- [Changelog](CHANGELOG.md) - Version history

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL v3)**.
See [LICENSE](LICENSE) for details.

---

*Maintained by the Harness Engineering Team | Last Updated: 2026-09-26*

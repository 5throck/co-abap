# Global Deliverables Index

This index serves as the single source of truth for tracking software requirements, their implementation progress, and quality gate verification status within the `co-abap` project.

## Requirements Traceability Matrix

| REQ ID | Title | Module | Current Stage | Primary Owner | Status | Link | Implemented Objects | QA Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Example** | *Pricing Condition Optimization* | *SD / FI* | *Stage 5* | *SD Analyst* | *Completed* | [Link](./REQ-000-example/) | `ZCL_SD_PRICING_CALC` | `PASSED` |
| **REQ-001** | *Flight Occupancy and Revenue Analysis Report* | *SD / FI / CO* | *Stage 5* | *SD Analyst* | *Completed* | [Link](./REQ-001-flight-occupancy-revenue-report/) | `ZFLIGHT_OCC_REVENUE` | `PASSED` (0 P1; P2 accepted — see 04 §3.2) |

---

## Workflow Stages & Responsible Agents

1. **Stage 1: Requirements Definition** (`01_srs.md`)
   - **Primary Owner**: Module Analyst (SD, FI, CO, MM, PP, LE) or PM (if cross-module)
   - **Output**: Functional and non-functional specifications, Given/When/Then testable scenarios.
2. **Stage 2: Technical Design** (`02_technical_design.md`)
   - **Primary Owner**: Architect & DBA
   - **Output**: Mermaid system architecture diagram, Mermaid ERD schema, Mermaid program control flow, objects change list.
3. **Stage 3: Coding & Implementation** (`03_implementation_report.md`)
   - **Primary Owner**: ABAP Developer (code-writer) or specialist agents: Fiori Developer (fiori-developer), Form Expert (form-expert), GUI Scripter (gui-scripter), Interface Expert (interface-expert)
   - **Output**: Source code edits on SAP system, compilation checks, links to implemented objects.
4. **Stage 4: Quality Gate Verification** (`04_qa_report.md`, `05_unit_test_plan.md`)
   - **Primary Owner**: QA Engineer (test-runner)
   - **Output**: Requirement→test traceability and expected-vs-actual results (`05`, planned at Stage 1 review, executed here), plus SyntaxCheck, RunUnitTests (code coverage), RunATCCheck (zero P1 findings) verification logs (`04`).
5. **Stage 5: Governance & Release** (`06_release_report.md`)
   - **Primary Owner**: PM & DevOps/Admin
   - **Output**: Documentation audit, deployment/transport status, promotion and rollback plan, handover (`06`), RTM finalization, final Git synchronization and commit.

# Unit Test Plan & Results
## [REQ-NNN] [Requirement Title]

> [!NOTE]
> Test plan with requirement traceability (IEEE 829-style, adapted). Fill expected results at planning time; fill actual results during Stage 4 execution.
> **Owner**: test-runner (plan) / code-writer (automated cases)

### Document Metadata
- **Associated SRS**: [01_srs.md](../01_srs.md)
- **Associated QA Report**: [04_qa_report.md](../04_qa_report.md)
- **System**: [SYS] / client [CLIENT]
- **Status**: PLANNED | EXECUTED
- **Last Updated**: YYYY-MM-DD

## 1. Traceability Matrix (Requirement → Test)

| Test ID | Requirement | Method / Level | Automated? |
| :--- | :--- | :--- | :--- |
| TC-01 | REQ-NNN-F01 | [method or manual step] | Yes / No |
| TC-02 | REQ-NNN-F02 | [method or manual step] | Yes / No |

## 2. Test Cases — Expected vs. Actual

| Test ID | Precondition / Test Data | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| TC-01 | [data] | [expected] | [actual / PENDING] | PASS / FAIL / OPEN |

## 3. Exit Criteria
- All automated cases PASS.
- Static checks (ATC): zero P1 findings.
- Manual cases: listed with owner and target session; none are code-path blockers unless noted.

# Design: Auto-merge approval gate for a solo-maintainer repository

- **Spec ID**: 2026-10-02-automerge-approval-gate
- **Date**: 2026-10-02
- **Status**: implemented
- **Source**: manual (user-requested)

## Problem

`.github/workflows/auto-merge.yml` requires 2 approvals pinned to the current
head SHA before it merges a PR. This repository has a single human
collaborator, and GitHub forbids PR authors from approving their own PRs, so
the gate is structurally unsatisfiable. Every PR logs a failing auto-merge run
("Only 0/2 current-head approvals") and is merged manually — observed on
PR #177 (2026-10-01 20:54Z) and in the run history since 2026-10-01.

## Decision

Drive the required-approval count from the repository variable
`AUTOMERGE_MIN_APPROVALS`, defaulting to 0 when the variable is unset. The
CI-check gates are unchanged: required checks must be present and every check
must conclude success. Re-enable approvals later by setting the variable to 1
or 2 once a second reviewer exists.

The merge method changes from `squash` to `merge` to match the observed
repository history — all merged PRs to date are merge commits created by
manual merges.

## Accessibility

Non-UI automation change — no accessibility impact (explicit statement per
ADR-0065).

## Preview Verification

Non-UI change — no rendered-preview verification required (explicit statement
per ADR-0070).

## Verification

- `bun scripts/audit.ts` — pipeline gate battery (this run).
- Live run on this PR: the gate evaluates with 0 required approvals, all
  checks green, and the PR merges.

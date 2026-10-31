# Design: Auto-merge approval default and gitleaks historical-path allowlist

- **Spec ID**: 2026-10-31-automerge-approval-default
- **Date**: 2026-10-31
- **Status**: implemented
- **Source**: manual (2026-10-31 security review remediation)

## Problem

Two approved findings from the 2026-10-31 security review:

1. **RT-02 (Medium)** — `.github/workflows/auto-merge.yml` defaulted
   `AUTOMERGE_MIN_APPROVALS` to `'0'` when the repository variable was
   unset. The in-script guard `approvals.length < minApprovals` is vacuous
   at 0, so any same-repo PR whose CI was green auto-merged with zero human
   approvals. (The 2026-10-02 design
   `docs/designs/2026-10-02-automerge-approval-gate-design.md` lowered a
   hard-coded 2 to a default of 0 because GitHub blocks PR authors from
   approving their own PRs in this single-collaborator repository; the
   residual risk is now being closed at the default level.)
2. **SC-04 (Low)** — `.gitleaks.toml` allowlisted the current
   `scratch/stable/zadt_vsp_git.prog.abap` and
   `scratch/stable/zabapgit_standalone.prog.abap` paths, but git history
   still contains both public open-source abapGit bundle files at their
   pre-move locations `scratch/zadt_vsp_git.prog.abap` and
   `scratch/zabapgit_standalone.prog.abap`. Every full-history scan
   (pre-push/pre-rebase over long ranges) reported 68 `generic-api-key`
   false positives — verified baseline: 34 findings per historical path.

## Decision

1. **RT-02**: change the workflow fallback from `'0'` to `'1'`
   (`AUTOMERGE_MIN_APPROVALS: ${{ vars.AUTOMERGE_MIN_APPROVALS || '1' }}`)
   and align the in-script defensive fallback
   (`Number(process.env.AUTOMERGE_MIN_APPROVALS || 1)`). Repository owners
   can still restore zero-approval automerge by setting the
   `AUTOMERGE_MIN_APPROVALS` repository variable to `0` (the string `"0"`
   is truthy in JavaScript, so the override reaches `Number()` intact), or
   raise it to 2+ for stricter gating. The header comment is updated to
   document the new default and the opt-out. The fork guard and the
   all-checks-success gate are unchanged.
2. **SC-04**: add the two historical path regexes to the `[allowlist]`
   `paths` list, mirroring the existing entry format:
   `^scratch/zadt_vsp_git\.prog\.abap$` and
   `^scratch/zabapgit_standalone\.prog\.abap$`, with a comment marking
   them as historical pre-move locations of the same public abapGit
   bundles (open-source content, `generic-api-key` false positives).

A third finding (TM-03, remote MCP endpoints) is a user decision and is
intentionally not addressed here.

## Accessibility

Non-UI automation/configuration change — no accessibility impact (explicit
statement per ADR-0065).

## Preview Verification

Non-UI change — no rendered-preview verification required (explicit
statement per ADR-0070).

## Verification

- Baseline reproduced before the fix: `gitleaks detect --config
  .gitleaks.toml -v` over full git history → `leaks found: 68` (34 +
  34, all `generic-api-key`, all at the two historical paths).
- After the fix: `gitleaks detect --config .gitleaks.toml -v` →
  443 commits scanned, `no leaks found`; `gitleaks detect --config
  .gitleaks.toml --no-git` → `no leaks found`.
- YAML sanity: `js-yaml` load of `.github/workflows/auto-merge.yml` →
  `yaml ok`.
- `bun scripts/audit.ts` — pipeline gate battery (this run).

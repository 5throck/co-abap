#!/usr/bin/env bun
/**
 * sap-action-audit.ts — PostToolUse hook for vsp MCP tools (matcher `mcp__abap__.*`).
 * Appends an audit record (hashes only), updates the evidence store
 * (memory/audit/sap-evidence.json) and consumes single-use R3 approvals.
 * Never throws and never blocks: a failure here must not break the session.
 * Design: docs/designs/2026-10-10-sap-write-safety-gate-design.md
 *
 * @version 1.0.0
 */

import {
  CHAIN, TOOL_PREFIX, actorOf, appendAudit, classify, consumeApproval, derivePackage, effectiveInput,
  findApproval, firstString, inputHash, loadPolicy, objectKey, profileOf, readEvidence, recomputeStatus,
  resolveToolName, sha256, targetOf, writeEvidence, type Evidence, type HookInput,
} from '../lib/sap-action-lib.ts';

const FAIL_RE = /"success"\s*:\s*false|"isError"\s*:\s*true|\b[1-9]\d*\s+(failed|failures|errors?)\b|\b(failed|failures|errors?)\s*[:=]\s*[1-9]|syntax error|not activated/i;

export function qaResultOf(response: unknown): 'pass' | 'fail' {
  if (response && typeof response === 'object' && (response as any).isError === true) return 'fail';
  const text = typeof response === 'string' ? response : JSON.stringify(response ?? '');
  return FAIL_RE.test(text) ? 'fail' : 'pass';
}

export function record(input: HookInput, root: string, now: Date = new Date()): void {
  if (!(input.tool_name ?? '').startsWith(TOOL_PREFIX)) return;
  const ti = effectiveInput(input.tool_input);
  const tool = resolveToolName(input.tool_name!, ti);
  const policy = loadPolicy(root);
  const cls = classify(tool, policy) ?? '?';
  const ts = now.toISOString();
  const key = objectKey(ti);
  const evidence = readEvidence(root);
  const pkg = derivePackage(ti, evidence);
  const transport = firstString(ti, ['transport', 'transport_number', 'transportNumber', 'request']);
  let decision = 'allow';
  let qaResult: string | undefined;
  let approver: string | undefined;

  if (cls === 'R2' && key) {
    const e: Evidence = evidence[key] ?? { chain: {}, status: 'pending' };
    if (tool.toLowerCase() === 'activate' || tool.toLowerCase() === 'addtotransport') {
      if (transport) e.transport = transport;
    } else {
      e.lastWriteTs = ts;
    }
    if (pkg) e.package = pkg;
    if (transport) e.transport = transport;
    e.status = recomputeStatus(e);
    evidence[key] = e;
    writeEvidence(root, evidence);
  } else if (cls === 'R1') {
    qaResult = qaResultOf(input.tool_response);
    const step = CHAIN.find((c) => c.toLowerCase() === tool.toLowerCase());
    if (step && key) {
      const e: Evidence = evidence[key] ?? { chain: {}, status: 'pending' };
      e.chain[step] = { ts, result: qaResult as 'pass' | 'fail' };
      e.status = recomputeStatus(e);
      evidence[key] = e;
      writeEvidence(root, evidence);
    }
  } else if (cls === 'R3') {
    const found = findApproval(root, policy, input.session_id, tool, targetOf(ti), now);
    if (found) {
      decision = 'approved';
      approver = found.approval.approver;
      consumeApproval(root, policy, input.session_id, found.index);
    }
  }

  const src = firstString(ti, ['source', 'new_string', 'content']);
  const before = firstString(ti, ['old_string', 'old_source']);
  const resp = input.tool_response as any;
  const respSrc = typeof resp?.source === 'string' ? resp.source : undefined;
  appendAudit(root, {
    ts, sessionId: input.session_id ?? 'unknown', actor: actorOf(input), tool, class: cls, decision,
    object: key, package: pkg, inputHash: inputHash(ti),
    beforeHash: before ? sha256(before) : undefined,
    afterHash: src ? sha256(src) : respSrc ? sha256(respSrc) : undefined,
    qaResult, approver, transport, profile: profileOf(),
  });
}

async function main(): Promise<void> {
  try {
    const input = JSON.parse(await Bun.stdin.text()) as HookInput;
    record(input, input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd());
  } catch { /* never block the session */ }
}

if (import.meta.main) await main();

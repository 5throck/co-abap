#!/usr/bin/env bun
/**
 * sap-approve.ts — human CLI that turns a pending SAP request (written by sap-mcp-proxy.ts)
 * into a single-use approval under memory/audit/approvals/.
 *
 * Usage: bun scripts/sap-approve.ts <id> [--approver name]
 *        bun scripts/sap-approve.ts --list
 *        bun scripts/sap-approve.ts <id> --deny
 * Agents are blocked from writing the approvals directory by .claude/settings.json deny rules,
 * and this CLI refuses to run without a TTY (set SAP_APPROVE_ALLOW_NON_TTY=1 only in tests).
 * Design: docs/designs/2026-10-10-cross-platform-parity-design.md (Phase 1)
 *
 * @version 1.0.0
 */

import { userInfo } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  appendAudit, grantApproval, listPending, loadPolicy, readEvidence, readPending, removePending,
  type PendingRequest,
} from './lib/sap-action-lib.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function describe(p: PendingRequest): string {
  return [
    `id        : ${p.id}`, `tool      : ${p.tool}  (class ${p.class})`, `target    : ${p.target || '(none)'}`,
    `object    : ${p.object ?? '(n/a)'}`, `package   : ${p.package ?? '(n/a)'}`, `reason    : ${p.reason}`,
    `input hash: ${p.inputHash.slice(0, 16)}...`, `requested : ${p.requestedAt} by ${p.actor}`, `expires   : ${p.expires}`,
  ].join('\n');
}

export function run(argv: string[], root: string = ROOT, now: Date = new Date()): { code: number; out: string } {
  const lines: string[] = [];
  const out = (s: string) => lines.push(s);
  let id: string | undefined; let approver: string | undefined; let list = false; let deny = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--list') list = true;
    else if (a === '--deny') deny = true;
    else if (a === '--approver') approver = argv[++i];
    else if (!a.startsWith('-')) id = a;
    else { out(`unknown option ${a}`); return { code: 2, out: lines.join('\n') }; }
  }
  if (list) {
    const live = listPending(root).filter((p) => Date.parse(p.expires) > now.getTime());
    if (!live.length) out('no pending SAP approval requests');
    for (const p of live) out(`${p.id}  ${p.class} ${p.tool}  ${p.target || '-'}  expires ${p.expires}`);
    return { code: 0, out: lines.join('\n') };
  }
  if (!id) { out('usage: bun scripts/sap-approve.ts <id> [--approver name] [--deny] | --list'); return { code: 2, out: lines.join('\n') }; }
  const p = readPending(root, id);
  if (!p) { out(`no pending request ${id}`); return { code: 1, out: lines.join('\n') }; }
  const who = approver || process.env.SAP_APPROVER || userInfo().username;
  const policy = loadPolicy(root);
  if (deny) {
    removePending(root, id);
    try {
      appendAudit(root, { ts: now.toISOString(), sessionId: 'approve-cli', actor: who, tool: p.tool, class: p.class, decision: 'denied_by_human',
        object: p.object, package: p.package, inputHash: p.inputHash, profile: 'proxy', reason: 'pending request rejected' });
    } catch { /* best effort */ }
    out(`rejected and removed pending request ${id}`);
    return { code: 0, out: lines.join('\n') };
  }
  out('Approving:'); out(describe(p));
  if (p.tool === 'ReleaseTransport') {
    const ev = readEvidence(root);
    const missing = Object.entries(ev).filter(([, e]) => e.transport && p.target && e.transport.toLowerCase() === p.target.toLowerCase() && e.status !== 'passed');
    if (missing.length) out(`WARNING: ${missing.length} tracked object(s) lack passed QA evidence; the proxy will still deny the release until they pass.`);
  }
  try {
    const a = grantApproval(root, policy, id, who, now);
    try {
      appendAudit(root, { ts: now.toISOString(), sessionId: 'approve-cli', actor: who, tool: p.tool, class: p.class, decision: 'approval_granted',
        object: p.object, package: p.package, inputHash: p.inputHash, approver: who, profile: 'proxy' });
    } catch { /* best effort */ }
    out(`\nApproved by ${who}. Single use, bound to this exact input, valid until ${a.expires}. The agent may now repeat the identical call.`);
    return { code: 0, out: lines.join('\n') };
  } catch (e) {
    out(`cannot approve: ${(e as Error).message}`);
    return { code: 1, out: lines.join('\n') };
  }
}

if (import.meta.main) {
  if (!(process.stdin.isTTY && process.stdout.isTTY) && process.env.SAP_APPROVE_ALLOW_NON_TTY !== '1' && !process.argv.includes('--list')) {
    console.error('sap-approve: refusing to run without an interactive terminal (approvals are for humans).');
    process.exit(3);
  }
  const r = run(process.argv.slice(2));
  console.log(r.out);
  process.exit(r.code);
}

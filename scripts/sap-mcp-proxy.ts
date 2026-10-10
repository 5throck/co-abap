#!/usr/bin/env bun
/**
 * sap-mcp-proxy.ts — platform-neutral stdio MCP proxy in front of vsp; the single SAP enforcement point.
 *
 * Usage: bun scripts/sap-mcp-proxy.ts [--vsp ./vsp] [--root <dir>] [-- [<vsp-command>] <vsp args...>]
 *
 * Every message passes through unchanged except `tools/call`, which is classified with
 * scripts/lib/sap-action-lib.ts (same logic as hooks/sap-action-gate.ts):
 *   allow -> forwarded, response captured, audit + QA evidence recorded (hooks/sap-action-audit.ts `record`)
 *   deny  -> MCP tool result isError=true; never forwarded
 *   ask   -> isError "APPROVAL_REQUIRED id=<id>"; a human runs `bun scripts/sap-approve.ts <id>`,
 *            the agent repeats the identical call, which is then forwarded once (single use).
 * R3 calls lacking an approval also answer APPROVAL_REQUIRED (release still needs passed QA evidence).
 * Fail safe: an internal error never allows a call; it becomes approval-required (or a plain deny).
 * The retired "manual" profile needs no special case: HARNESS_PROFILE is ignored here.
 * Design: docs/designs/2026-10-10-cross-platform-parity-design.md (Phase 1)
 *
 * @version 1.0.0
 */

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { StringDecoder } from 'node:string_decoder';
import { evaluate } from './hooks/sap-action-gate.ts';
import { record } from './hooks/sap-action-audit.ts';
import {
  NEEDS_APPROVAL, TOOL_PREFIX, appendAudit, approvalId, consumeProxyApproval, derivePackage, effectiveInput,
  inputHash, isHyperfocused, loadPolicy, objectKey, readEvidence, resolveHyperfocused, targetOf, writePending,
  type HookInput, type Policy,
} from './lib/sap-action-lib.ts';

const SESSION = `proxy-${Date.now().toString(36)}-${process.pid}`;
const PROFILE = 'proxy';

type Json = Record<string, any>;

export interface Verdict {
  kind: 'allow' | 'deny' | 'approval' | 'approved';
  text?: string; id?: string; approver?: string; cls: string; tool: string; reason: string;
}

const toolResult = (id: unknown, text: string) =>
  ({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text }], isError: true } });

/** Decide one tools/call. Pure w.r.t. the wire; touches only the audit/approval stores under `root`. */
export function decide(params: Json, root: string, actor: string, now: Date = new Date()): Verdict {
  const name = typeof params?.name === 'string' ? params.name : '';
  const args = params?.arguments ?? {};
  const hook: HookInput = { session_id: SESSION, tool_name: TOOL_PREFIX + name, tool_input: args, cwd: root, agent_name: actor };
  let policy: Policy | undefined;
  let res: { decision: string; reason: string; cls: string; tool: string };
  try {
    policy = loadPolicy(root);
    if (!name) throw new Error('tools/call without a tool name');
    res = evaluate(hook, root, now);
  } catch (e) {
    res = { decision: 'ask', cls: '?', tool: name || '?', reason: `gate error, failing safe: ${(e as Error).message}` };
  }
  if (res.decision === 'deny' && res.reason === NEEDS_APPROVAL) res = { ...res, decision: 'ask' };
  const base = { cls: res.cls, tool: res.tool, reason: res.reason };

  let ti: Record<string, unknown> = {};
  let hash = '';
  let target = '';
  let hf: ReturnType<typeof resolveHyperfocused> | undefined;
  try {
    ti = effectiveInput(args);
    hash = inputHash(args);
    if (policy && isHyperfocused(hook.tool_name!)) {
      hf = resolveHyperfocused(args, policy);
      target = hf.approvalTarget ?? '';
    } else {
      target = targetOf(ti) ?? '';
    }
  } catch { /* hash stays empty: approvals cannot match, requests still get a pending id */ }

  const audit = (decision: string) => {
    try {
      appendAudit(root, {
        ts: now.toISOString(), sessionId: SESSION, actor, tool: res.tool, class: res.cls, decision,
        object: hf?.keys[0] ?? objectKey(ti), package: hf?.packages[0] ?? derivePackage(ti, readEvidence(root)),
        inputHash: hash || inputHash({}), profile: PROFILE, reason: res.reason,
      });
    } catch { /* logging must not change the decision */ }
  };

  if (res.decision === 'allow') return { kind: 'allow', ...base };
  if (res.decision === 'deny') {
    audit('deny');
    return { kind: 'deny', ...base, text: `DENIED by SAP safety gate [${res.cls} ${res.tool}]: ${res.reason}. The call was not sent to SAP.` };
  }
  // ask: a previously granted, still valid, exactly matching approval is consumed here
  try {
    if (policy && hash) {
      const a = consumeProxyApproval(root, policy, res.tool, target, hash, now);
      if (a) return { kind: 'approved', ...base, approver: a.approver, id: a.id };
    }
  } catch { /* fall through to a new request */ }
  const id = approvalId(res.tool, target, hash);
  try {
    if (!policy) throw new Error('policy unavailable');
    writePending(root, policy, {
      id, tool: res.tool, target, class: res.cls, inputHash: hash, reason: res.reason, actor,
      object: hf?.keys[0] ?? objectKey(ti), package: hf?.packages[0],
    }, now);
  } catch (e) {
    audit('deny');
    return { kind: 'deny', ...base, text: `DENIED by SAP safety gate [${res.cls} ${res.tool}]: ${res.reason}; approval request could not be stored (${(e as Error).message}). The call was not sent to SAP.` };
  }
  audit('approval_required');
  return {
    kind: 'approval', id, ...base,
    text: `APPROVAL_REQUIRED id=${id}\n[${res.cls} ${res.tool}] ${res.reason}.\nThis call was not sent to SAP. A human must approve it by running:\n  bun scripts/sap-approve.ts ${id}\nthen repeat the identical call (single use, input-bound, expires in minutes).`,
  };
}

// ---------------------------------------------------------------------------
// Wire handling
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): { vsp: string; vspArgs: string[]; root: string } {
  let vsp = './vsp';
  let root = resolve(import.meta.dir, '..');
  let rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--') { rest = argv.slice(i + 1); break; }
    if (argv[i] === '--vsp') vsp = argv[++i] ?? vsp;
    else if (argv[i] === '--root') root = resolve(argv[++i] ?? root);
  }
  if (rest.length && !rest[0].startsWith('-')) { vsp = rest[0]; rest = rest.slice(1); }
  return { vsp, vspArgs: rest, root };
}

/** Safety defaults every client gets regardless of what its own MCP config passes (mirrors .mcp.json). */
export const SAFE_DEFAULTS: Record<string, string> = {
  SAP_MODE: 'hyperfocused',
  SAP_ALLOWED_PACKAGES: 'Z*,$TMP,$ZADT_VSP,$VSP_ADT',
  SAP_FEATURE_ABAPGIT: 'off',
  SAP_FEATURE_TRANSPORT: 'off',
  SAP_FEATURE_UI5: 'off',
  SAP_FEATURE_RAP: 'off',
};

/** Minimal dotenv parser (KEY=VALUE, optional quotes, `export ` prefix, # comments). Values are never logged. */
export function parseDotenv(src: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of src.split(/\r?\n/)) {
    const m = raw.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if (/^(["']).*\1$/.test(v) && v.length >= 2) v = v.slice(1, -1);
    else v = v.replace(/\s+#.*$/, '');
    out[m[1]] = v;
  }
  return out;
}

/** vsp environment: non-empty process env wins, then <root>/.env, then safety defaults. */
export function buildVspEnv(root: string, base: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...base };
  delete env.HARNESS_PROFILE; // manual profile retired; one policy for every client
  let dot: Record<string, string> = {};
  try { dot = parseDotenv(readFileSync(join(root, '.env'), 'utf-8')); } catch { /* no .env */ }
  for (const [k, v] of Object.entries({ ...SAFE_DEFAULTS, ...dot })) {
    if (!env[k]) env[k] = (k in dot ? dot[k] : v) || v;
  }
  return env;
}

function main(): void {
  const { vsp, vspArgs, root } = parseArgs(process.argv.slice(2));
  const env = buildVspEnv(root, process.env);
  delete process.env.HARNESS_PROFILE; // the in-process gate must not see the retired manual profile
  const defaultVsp = join(root, process.platform === 'win32' ? 'vsp.exe' : 'vsp');
  const cmd = vsp === './vsp' ? defaultVsp : vsp.includes('/') || vsp.includes('\\') ? resolve(root, vsp) : vsp;
  const child = spawn(cmd, vspArgs, { cwd: root, env, stdio: ['pipe', 'pipe', 'inherit'] });
  let actor = 'main';
  const inflight = new Map<string, { params: Json; approver?: string; decision: string; started: Date }>();
  let childAlive = true;

  const toClient = (msg: unknown) => process.stdout.write((typeof msg === 'string' ? msg : JSON.stringify(msg)) + '\n');
  const toVsp = (msg: unknown) => {
    if (!childAlive || !child.stdin.writable) return false;
    child.stdin.write((typeof msg === 'string' ? msg : JSON.stringify(msg)) + '\n');
    return true;
  };

  child.on('error', (e) => {
    process.stderr.write(`sap-mcp-proxy: cannot start ${cmd}: ${e.message}\n`);
    process.exit(127);
  });
  child.stdin.on('error', () => { /* handled by exit */ });

  const handleClient = (line: string, raw: string) => {
    let msg: any;
    try { msg = JSON.parse(line); } catch { toVsp(raw); return; } // not JSON: let vsp answer
    if (Array.isArray(msg)) { for (const m of msg) handleMessage(m); return; } // legacy batch: handled per element
    handleMessage(msg);
  };

  const handleMessage = (msg: any) => {
    if (msg?.method === 'initialize' && typeof msg.params?.clientInfo?.name === 'string') actor = msg.params.clientInfo.name;
    if (!msg || msg.method !== 'tools/call') { toVsp(msg); return; }
    let v: Verdict;
    try {
      v = decide(msg.params ?? {}, root, actor);
    } catch (e) {
      v = { kind: 'deny', cls: '?', tool: '?', reason: 'internal error', text: `DENIED by SAP safety gate: internal error (${(e as Error).message}). The call was not sent to SAP.` };
    }
    if (v.kind === 'deny' || v.kind === 'approval') {
      if (msg.id !== undefined) toClient(toolResult(msg.id, v.text!));
      return;
    }
    if (msg.id === undefined) { toVsp(msg); return; } // notification form: nothing to wait for
    inflight.set(JSON.stringify(msg.id), {
      params: msg.params, decision: v.kind === 'approved' ? 'approved' : 'allow', approver: v.approver, started: new Date(),
    });
    if (!toVsp(msg)) {
      inflight.delete(JSON.stringify(msg.id));
      toClient(toolResult(msg.id, 'SAP backend (vsp) is not running; the call was not sent.'));
    }
  };

  const handleVsp = (line: string) => {
    let msg: any;
    try { msg = JSON.parse(line); } catch { toClient(line); return; }
    const key = msg && msg.id !== undefined && (msg.result !== undefined || msg.error !== undefined) ? JSON.stringify(msg.id) : undefined;
    const ctx = key ? inflight.get(key) : undefined;
    if (key && ctx) {
      inflight.delete(key);
      try {
        const name = String(ctx.params?.name ?? '');
        const response = msg.error ? { isError: true, error: msg.error } : msg.result;
        record(
          { session_id: SESSION, tool_name: TOOL_PREFIX + name, tool_input: ctx.params?.arguments ?? {}, tool_response: response, cwd: root, agent_name: actor },
          root, new Date(), { decision: ctx.decision, approver: ctx.approver, profile: PROFILE },
        );
      } catch { /* audit must not break the session */ }
    }
    toClient(line);
  };

  const pump = (stream: NodeJS.ReadableStream, onLine: (line: string, raw: string) => void, onEnd: () => void) => {
    const dec = new StringDecoder('utf8');
    let buf = '';
    const flush = (final: boolean) => {
      let i: number;
      while ((i = buf.indexOf('\n')) >= 0) {
        const raw = buf.slice(0, i); buf = buf.slice(i + 1);
        const line = raw.replace(/\r$/, '');
        if (line.trim()) onLine(line, line);
      }
      if (final && buf.trim()) { onLine(buf.replace(/\r$/, ''), buf); buf = ''; }
    };
    stream.on('data', (c: Buffer | string) => { buf += typeof c === 'string' ? c : dec.write(c); flush(false); });
    stream.on('end', () => { buf += dec.end(); flush(true); onEnd(); });
  };

  let vspOut = false;
  let exitCode: number | null = null;
  const maybeExit = () => {
    if (vspOut && exitCode !== null) {
      for (const [k] of inflight) toClient(toolResult(JSON.parse(k), 'SAP backend (vsp) exited before answering.'));
      process.exitCode = exitCode;
      process.stdin.destroy(); // let stdout drain, then exit naturally (process.exit would truncate large output)
    }
  };
  pump(child.stdout!, (l) => handleVsp(l), () => { vspOut = true; maybeExit(); });
  child.on('exit', (code, sig) => { childAlive = false; exitCode = code ?? (sig ? 1 : 0); maybeExit(); });
  pump(process.stdin, handleClient, () => { try { child.stdin.end(); } catch { /* gone */ } });
  for (const s of ['SIGTERM', 'SIGINT'] as const) process.on(s, () => { try { child.kill(s); } catch { /* gone */ } });
}

if (import.meta.main) main();

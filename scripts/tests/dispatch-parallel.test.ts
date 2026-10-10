/** @version 1.5.0 */
import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { realpathSync } from 'node:fs';
import { secureHome } from './fixtures/sap-secure-home.ts';
import { join } from 'node:path';
import { proxyArgv, GrantRequiredError, validateWriteRows, PLAN_BEGIN, killCommand, buildAdapter, buildChildEnv, resolveOutDir, buildPrompt, fanOut, parsePlan, resolveModel, runPlatformMode } from '../dispatch-parallel.ts';

const REPO = join(import.meta.dir, '..', '..');
let tmp: string, root: string, bin: string, oldPath: string | undefined;

function setLog(f: string) { writeFileSync(join(bin, 'logpath'), f); }
function stub(name: string, body: string) {
  writeFileSync(join(bin, name), `#!/bin/sh\n${body}\n`);
  chmodSync(join(bin, name), 0o755);
}

beforeAll(() => {
  tmp = mkdtempSync(join(tmpdir(), 'dispatch-'));
  root = join(tmp, 'repo'); bin = join(tmp, 'bin');
  mkdirSync(join(root, 'agents'), { recursive: true }); mkdirSync(join(root, 'docs')); mkdirSync(bin);
  copyFileSync(join(REPO, 'docs', 'workspace-schema.json'), join(root, 'docs', 'workspace-schema.json'));
  writeFileSync(join(root, 'agents', 'architect.md'), '---\nname: architect\n---\nYou are the architect.\n');
  writeFileSync(join(root, 'agents', 'auditor.md'), 'You are the auditor.\n');
  // Stubs: log "start"/"end", echo argv + stdin so tests can assert prompt identity.
  const common = 'STUB_LOG=$(cat "$(dirname "$0")/logpath"); echo "start $$" >> "$STUB_LOG"; PROMPT=$(cat); sleep 0.4; echo "end $$" >> "$STUB_LOG"';
  stub('codex', `${common}\nOUT=""; while [ $# -gt 0 ]; do [ "$1" = "-o" ] && OUT="$2"; ARGS="$ARGS $1"; shift; done\necho "ARGS:$ARGS" > "$OUT"; printf '%s' "$PROMPT" >> "$OUT"`);
  stub('gemini', `${common}\necho "ARGS:$*"; printf '%s' "$PROMPT"`);
  stub('claude', `${common}\necho "ARGS:$*"; printf '%s' "$PROMPT"`);
  stub('hermes', `STUB_LOG=$(cat "$(dirname "$0")/logpath"); echo "start $$" >> "$STUB_LOG"; echo "ARGS:$1"; printf '%s' "$2"`);
  stub('slowcodex', 'exec sleep 5');
  oldPath = process.env.PATH;
  process.env.PATH = `${bin}:${oldPath}`;
});
afterAll(() => { process.env.PATH = oldPath; rmSync(tmp, { recursive: true, force: true }); });

const tasks = [
  { description: 'a', role: 'architect', task: 'T1', tier: 'high' as const },
  { description: 'b', role: 'auditor', task: 'T2', tier: 'medium' as const, context: ['ctx'], outputFormat: 'markdown' },
  { description: 'c', role: 'architect', task: 'T3', tier: 'low' as const },
];

describe('prompt + models', () => {
  test('prompt is built from role body (no frontmatter) + task', () => {
    const p = buildPrompt(tasks[1], root);
    expect(p.startsWith('You are the auditor.\n')).toBe(true);
    expect(p).toContain(`${PLAN_BEGIN}\n## Task\n\nT2\n\n## Context\n\n- ctx\n\n## Output format\n\nmarkdown\n<<<UNTRUSTED_PLAN_DATA_END>>>`);
    expect(buildPrompt({ ...tasks[0], task: `x ${PLAN_BEGIN} y` }, root).split(PLAN_BEGIN)).toHaveLength(2);
    expect(buildPrompt(tasks[0], root)).not.toContain('name: architect');
  });
  test('prompt identical across platforms', () => {
    const p = buildPrompt(tasks[1], root);
    for (const plat of ['codex', 'gemini', 'claude'] as const) {
      const a = buildAdapter(plat, 'm', p, root, '/o');
      expect(a.stdin).toBe(p);
    }
    expect(buildAdapter('hermes', 'm', p, root, '/o').cmd[2]).toBe(p);
  });
  test('rejects path-like roles', () => {
    expect(() => buildPrompt({ ...tasks[0], role: '../x' }, root)).toThrow();
  });
  test('tier to model', () => {
    expect(resolveModel('codex', 'high')).toBe('gpt-5.6-sol');
    expect(resolveModel('claude', 'low')).toBe('haiku');
    expect(resolveModel('gemini', 'medium')).toBe('gemini-3.8-flash');
    expect(() => resolveModel('codex', 'ultra')).toThrow(/Unknown tier/);
    expect(() => resolveModel('antigravity-cli', 'high')).toThrow(/pending verification/);
  });
  test('read-only flags by default', () => {
    expect(buildAdapter('codex', 'm', 'p', root, '/o').cmd.join(' ')).toContain('-s read-only');
    expect(buildAdapter('gemini', 'm', 'p', root, '/o').cmd.join(' ')).toContain('--approval-mode plan');
    expect(buildAdapter('claude', 'm', 'p', root, '/o').cmd.join(' ')).toContain('--permission-mode plan');
  });
  test('parsePlan json and markdown', () => {
    const j = join(tmp, 'p.json'); writeFileSync(j, JSON.stringify([{ role: 'architect', task: 'x', tier: 'high' }]));
    expect(parsePlan(j)[0].tier).toBe('high');
    const m = join(tmp, 'p.md'); writeFileSync(m, '| task | role | tier |\n|---|---|---|\n| do it | auditor | low |\n');
    expect(parsePlan(m)).toMatchObject([{ role: 'auditor', task: 'do it', tier: 'low' }]);
    writeFileSync(j, JSON.stringify([{ role: 'a', task: 'x', tier: 'huge' }]));
    expect(() => parsePlan(j)).toThrow(/unknown tier/);
  });
});

describe('fan-out with stub CLIs', () => {
  test('codex rows start in parallel and results are collected', async () => {
    const log = join(tmp, 'codex.log'); writeFileSync(log, ''); setLog(log);
    const { results, runDir } = await fanOut(tasks, 'codex', { root, outDir: join(root, 'memory', 'dispatch'), runId: 'r1', maxParallel: 3 });
    expect(results.map(r => r.status)).toEqual(['completed', 'completed', 'completed']);
    const lines = readFileSync(log, 'utf-8').trim().split('\n').map(l => l.split(' ')[0]);
    expect(lines.slice(0, 3)).toEqual(['start', 'start', 'start']);
    const md = readFileSync(results[1].file, 'utf-8');
    expect(md).toContain('model: gpt-5.6-terra');
    expect(md).toContain(buildPrompt(tasks[1], root).trimEnd());
    expect(md).toContain('-s read-only');
    const summary = JSON.parse(readFileSync(join(runDir, 'summary.json'), 'utf-8'));
    expect(summary.platform).toBe('codex');
    expect(summary.results).toHaveLength(3);
  });
  test('max-parallel 1 serializes', async () => {
    const log = join(tmp, 'ser.log'); writeFileSync(log, ''); setLog(log);
    await fanOut(tasks.slice(0, 2), 'gemini', { root, outDir: join(root, 'memory', 'dispatch'), runId: 'r2', maxParallel: 1 });
    expect(readFileSync(log, 'utf-8').trim().split('\n').map(l => l.split(' ')[0])).toEqual(['start', 'end', 'start', 'end']);
  });
  test('gemini, claude, hermes get identical prompt text', async () => {
    setLog(join(tmp, 'x.log'));
    const expected = buildPrompt(tasks[0], root);
    for (const plat of ['gemini', 'claude', 'hermes'] as const) {
      const { results } = await fanOut([tasks[0]], plat, { allowHermesWrite: true, root, outDir: join(root, 'memory', 'dispatch'), runId: `id-${plat}` });
      expect(results[0].status).toBe('completed');
      expect(readFileSync(results[0].file, 'utf-8')).toContain(expected.trimEnd());
    }
  });
  test('timeout and failure isolation', async () => {
    const slowBin = join(tmp, 'bin2'); mkdirSync(slowBin);
    writeFileSync(join(slowBin, 'codex'), '#!/bin/sh\nexec sleep 5\n'); chmodSync(join(slowBin, 'codex'), 0o755);
    writeFileSync(join(slowBin, 'gemini'), '#!/bin/sh\necho boom >&2; exit 3\n'); chmodSync(join(slowBin, 'gemini'), 0o755);
    const saved = process.env.PATH; process.env.PATH = `${slowBin}:${saved}`;
    try {
      const t0 = Date.now();
      const slow = await fanOut(tasks.slice(0, 2), 'codex', { root, outDir: join(root, 'memory', 'dispatch'), runId: 'r3', timeoutMs: 300 });
      expect(slow.results.every(r => r.status === 'timeout')).toBe(true);
      expect(Date.now() - t0).toBeLessThan(4000);
      const bad = await fanOut([tasks[0], { ...tasks[0], role: 'nonexistent' }], 'gemini', { root, outDir: join(root, 'memory', 'dispatch'), runId: 'r4' });
      expect(bad.results.map(r => r.status)).toEqual(['failed', 'error']);
      expect(bad.results[0].exitCode).toBe(3);
      expect(readFileSync(bad.results[0].file, 'utf-8')).toContain('boom');
    } finally { process.env.PATH = saved; }
  });
});

describe('hardening', () => {
  test('child env is an allowlist without SAP_* and sets max class', () => {
    const env = buildChildEnv('codex', { PATH: '/b', HOME: '/h', SAP_PASSWORD: 'x', SAP_USER: 'u', OPENAI_API_KEY: 'k', ANTHROPIC_API_KEY: 'a', RANDOM: '1' });
    expect(env).toEqual({ PATH: '/b', HOME: '/h', OPENAI_API_KEY: 'k', SAP_PROXY_MAX_CLASS: 'R0', SAP_DISPATCH_CHILD: '1', SAP_DISPATCH_MODE: 'read' });
    expect(buildChildEnv('gemini', { GOOGLE_CLOUD_PROJECT: 'p', GEMINI_API_KEY: 'g' })).toMatchObject({ GOOGLE_CLOUD_PROJECT: 'p', GEMINI_API_KEY: 'g' });
  });
  test('spawned stub does not see SAP_PASSWORD but sees R0', async () => {
    stub('codex', 'cat >/dev/null; OUT=""; while [ $# -gt 0 ]; do [ "$1" = "-o" ] && OUT="$2"; shift; done; echo "pw=[$SAP_PASSWORD] max=[$SAP_PROXY_MAX_CLASS]" > "$OUT"');
    process.env.SAP_PASSWORD = 'secret';
    try {
      const { results } = await fanOut([tasks[0]], 'codex', { root, runId: 'env1' });
      const md = readFileSync(results[0].file, 'utf-8');
      expect(md).toContain('pw=[] max=[R0]');
    } finally { delete process.env.SAP_PASSWORD; }
  });
  test('out-dir must be under memory/dispatch', async () => {
    expect(() => resolveOutDir('/etc', root)).toThrow(/--out-dir/);
    expect(() => resolveOutDir(join(root, 'memory', 'dispatch', '..', '..', 'x'), root)).toThrow(/--out-dir/);
    expect(resolveOutDir(join(root, 'memory', 'dispatch', 'a'), root)).toBe(join(root, 'memory', 'dispatch', 'a'));
    await expect(fanOut([tasks[0]], 'codex', { root, outDir: join(tmp, 'elsewhere'), runId: 'x' })).rejects.toThrow(/--out-dir/);
  });
  test('hermes refused without --allow-hermes-write', async () => {
    const r = await fanOut([tasks[0]], 'hermes', { root, runId: 'h1' });
    expect(r.results[0].status).toBe('error');
    expect(r.results[0].error).toContain('no read-only mode is verified');
    const plan = join(tmp, 'hplan.json'); writeFileSync(plan, JSON.stringify([{ role: 'architect', task: 'x' }]));
    expect(await runPlatformMode(['--platform', 'hermes', '--plan', plan], root)).toBe(1);
  });
  test('timeout kills the whole process group', async () => {
    const pidFile = join(tmp, 'grandchild.pid');
    stub('codex', `sleep 30 & echo $! > "${pidFile}"; wait`);
    const r = await fanOut([tasks[0]], 'codex', { root, runId: 'pg1', timeoutMs: 700 });
    expect(r.results[0].status).toBe('timeout');
    await Bun.sleep(200);
    const pid = Number(readFileSync(pidFile, 'utf-8').trim());
    let alive = true;
    try { process.kill(pid, 0); alive = !/\nState:\s+[ZX]/.test(readFileSync(`/proc/${pid}/status`, 'utf-8')); } catch { alive = false; }
    expect(alive).toBe(false);
  });
});

describe('staged shutdown', () => {
  test('graceful exit within grace when child traps SIGTERM', async () => {
    stub('codex', `trap 'exit 0' TERM; sleep 30 & wait`);
    const r = await fanOut([tasks[0]], 'codex', { root, runId: 'sg1', timeoutMs: 400, killGraceMs: 3000 });
    expect(r.results[0].status).toBe('timeout');
    expect(r.results[0].cleanup).toBe('graceful');
    expect(readFileSync(r.results[0].file, 'utf-8')).toContain('cleanup: graceful');
  });
  test('forced kill after grace when SIGTERM is ignored', async () => {
    stub('codex', `trap '' TERM; while :; do sleep 0.1; done`);
    const t0 = Date.now();
    const r = await fanOut([tasks[0]], 'codex', { root, runId: 'sg2', timeoutMs: 300, killGraceMs: 500 });
    expect(r.results[0].status).toBe('timeout');
    expect(r.results[0].cleanup).toBe('forced');
    expect(Date.now() - t0).toBeLessThan(5000);
  });
  test('parent SIGTERM cleans up child groups', async () => {
    const pidFile = join(tmp, 'parent.pid');
    stub('codex', `echo $$ > "${pidFile}"; trap '' TERM; while :; do sleep 0.1; done`);
    const script = join(tmp, 'drv.ts');
    writeFileSync(script, `import { fanOut } from ${JSON.stringify(join(REPO, 'scripts', 'dispatch-parallel.ts'))};
await fanOut([{ description: 'a', role: 'architect', task: 'x' }], 'codex', { root: ${JSON.stringify(root)}, runId: 'sg3', killGraceMs: 300, exitOnSignal: true });`);
    const p = Bun.spawn(['bun', script], { env: process.env, stdout: 'ignore', stderr: 'ignore' });
    for (let i = 0; i < 50 && !existsSync(pidFile); i++) await Bun.sleep(100);
    const pid = Number(readFileSync(pidFile, 'utf-8').trim());
    p.kill('SIGTERM');
    await p.exited;
    await Bun.sleep(300);
    let alive = true;
    try { process.kill(pid, 0); alive = !/\nState:\s+[ZX]/.test(readFileSync(`/proc/${pid}/status`, 'utf-8')); } catch { alive = false; }
    expect(alive).toBe(false);
  });
  test('kill command selection', () => {
    expect(killCommand(42, false, 'linux')).toEqual({ kind: 'signal', pid: -42, signal: 'SIGTERM' });
    expect(killCommand(42, true, 'linux')).toEqual({ kind: 'signal', pid: -42, signal: 'SIGKILL' });
    expect(killCommand(42, false, 'win32')).toEqual({ kind: 'taskkill', cmd: ['taskkill', '/T', '/PID', '42'] });
    expect(killCommand(42, true, 'win32')).toEqual({ kind: 'taskkill', cmd: ['taskkill', '/T', '/F', '/PID', '42'] });
  });
});

describe('write rows and grants', () => {
  const scope = (objs: string[], maxClass: 'R2' | 'R3' = 'R2') => ({ packages: ['ZPKG'], objects: objs, actions: ['edit'], maxClass });
  const w = (objs: string[], extra: object = {}) => ({ ...tasks[0], mode: 'write' as const, sapScope: scope(objs), ...extra });
  function api(grant: boolean) {
    const calls: string[] = []; const reqs: any[] = [];
    return { calls, reqs, createGrantRequest: (r: any) => { calls.push('create'); reqs.push(r); }, findGrant: () => { calls.push('verify'); return grant ? { grantId: 'G1' } : null; }, revokeGrant: (id: string) => { calls.push('revoke:' + id); } };
  }
  test('overlapping object sets rejected, disjoint accepted, scope required', () => {
    expect(() => validateWriteRows([w(['CLAS zcl_a']), w(['CLAS ZCL_A'])])).toThrow(/overlap/);
    expect(() => validateWriteRows([w(['CLAS ZCL_A']), w(['CLAS ZCL_B'])])).not.toThrow();
    const j = join(tmp, 'w.json'); writeFileSync(j, JSON.stringify([{ role: 'architect', task: 'x', mode: 'write' }]));
    expect(() => parsePlan(j)).toThrow(/sapScope/);
  });
  test('no grant: request written, nothing spawned, error tells human what to run', async () => {
    const a = api(false);
    const err = await fanOut([w(['CLAS ZCL_A'])], 'codex', { root, runId: 'gr1', grantApi: a }).catch(e => e);
    expect(err).toBeInstanceOf(GrantRequiredError);
    expect(err.message).toContain('sap-approve.ts --grant gr1');
    expect(a.calls).toEqual(['verify', 'create']);
    expect(a.reqs[0].runId).toBe('gr1');
    expect(a.reqs[0].rows[0].maxClass).toBe('R2');
  });
  test('grant present: children get grant env and row max class; grant revoked after', async () => {
    stub('codex', 'cat >/dev/null; OUT=""; while [ $# -gt 0 ]; do [ "$1" = "-o" ] && OUT="$2"; [ "$1" = "-s" ] && S="$2"; shift; done; echo "g=[$SAP_DISPATCH_GRANT] r=[$SAP_DISPATCH_ROW] m=[$SAP_PROXY_MAX_CLASS] s=[$S]" > "$OUT"');
    const a = api(true);
    const r = await fanOut([w(['CLAS ZCL_A'], { sapScope: scope(['CLAS ZCL_A'], 'R3') }), tasks[1]], 'codex', { root, runId: 'gr2', grantApi: a });
    expect(readFileSync(r.results[0].file, 'utf-8')).toContain('g=[G1] r=[01-architect] m=[R3] s=[workspace-write]');
    expect(readFileSync(r.results[1].file, 'utf-8')).toContain('g=[] r=[] m=[R0] s=[read-only]');
    expect(a.calls.at(-1)).toBe('revoke:G1');
  });
  test('worktree row runs in its own worktree that is removed afterwards', async () => {
    const g = (...x: string[]) => Bun.spawnSync(['git', '-C', root, ...x], { stdout: 'pipe', stderr: 'pipe' });
    g('init', '-q'); g('-c', 'user.email=a@b', '-c', 'user.name=t', 'commit', '-q', '--allow-empty', '-m', 'i');
    stub('codex', 'cat >/dev/null; OUT=""; while [ $# -gt 0 ]; do [ "$1" = "-o" ] && OUT="$2"; shift; done; pwd > "$OUT"');
    const r = await fanOut([w(['CLAS ZCL_A'], { worktree: true })], 'codex', { root, runId: 'gr3', grantApi: api(true) });
    const body = readFileSync(r.results[0].file, 'utf-8');
    expect(body).toContain(join('gr3', 'wt', '01-architect'));
    expect(existsSync(join(root, 'memory', 'dispatch', 'gr3', 'wt', '01-architect'))).toBe(false);
  });
  test('hermes: write and read rows both refused without --allow-hermes-write', async () => {
    stub('hermes', 'echo ok');
    const rw = await fanOut([w(['CLAS ZCL_A'])], 'hermes', { root, runId: 'gh1', grantApi: api(true) });
    expect(rw.results[0].status).toBe('error');
    const rr = await fanOut([tasks[0]], 'hermes', { root, runId: 'gh2' });
    expect(rr.results[0].status).toBe('error');
    const ok = await fanOut([w(['CLAS ZCL_A'])], 'hermes', { root, runId: 'gh3', grantApi: api(true), allowHermesWrite: true });
    expect(ok.results[0].status).toBe('completed');
  });
  test('proxy argv carries dispatch flags and canonical root', () => {
    const a = proxyArgv('/repo', 'R2', 'G1', '01-x', 'write');
    expect(a.slice(1)).toEqual(['--root', '/repo', '--dispatch-child', '--dispatch-mode', 'write', '--max-class', 'R2', '--dispatch-grant', 'G1', '--dispatch-row', '01-x', '--', '--mode', 'hyperfocused']);
    expect(a[0]).toBe('/repo/scripts/sap-mcp-proxy.ts');
    expect(proxyArgv('/repo', 'R0')).not.toContain('--dispatch-grant');
  });
  test('per-platform MCP override reaches the child command line / env', async () => {
    stub('codex', 'cat >/dev/null; echo "$@" > "$(dirname "$0")/codex.argv"; OUT=""; while [ $# -gt 0 ]; do [ "$1" = "-o" ] && OUT="$2"; shift; done; echo done > "$OUT"');
    stub('claude', 'cat >/dev/null; echo "$@"');
    stub('gemini', 'cat >/dev/null; echo "S=$GEMINI_CLI_SYSTEM_SETTINGS_PATH"');
    await fanOut([w(['CLAS ZCL_A'])], 'codex', { root, runId: 'pc1', grantApi: api(true) });
    const argv = readFileSync(join(bin, 'codex.argv'), 'utf-8');
    expect(argv).toContain('mcp_servers.abap.args=[');
    expect(argv).toContain('--dispatch-child');
    expect(argv).toContain('--dispatch-grant');
    expect(argv).toContain('--dispatch-mode');
    const c = await fanOut([tasks[0]], 'claude', { root, runId: 'pc2' });
    expect(readFileSync(c.results[0].file, 'utf-8')).toContain('--strict-mcp-config');
    const cfg = JSON.parse(readFileSync(join(c.runDir, '01-architect.mcp.json'), 'utf-8'));
    expect(cfg.mcpServers.abap.args).toContain('--dispatch-child');
    expect(cfg.mcpServers.abap.args).toContain('R0');
    const g = await fanOut([tasks[0]], 'gemini', { root, runId: 'pc3' });
    expect(readFileSync(g.results[0].file, 'utf-8')).toContain('01-architect.mcp.json');
  });
  test('worktree row passes the main repo root, not the worktree', async () => {
    stub('codex', 'cat >/dev/null; OUT=""; while [ $# -gt 0 ]; do [ "$1" = "-o" ] && OUT="$2"; ARGS="$ARGS $1"; shift; done; echo "$ARGS" > "$OUT"');
    const r = await fanOut([w(['CLAS ZCL_A'], { worktree: true })], 'codex', { root, runId: 'pc4', grantApi: api(true) });
    const body = readFileSync(r.results[0].file, 'utf-8');
    expect(body).toContain(`--root`);
    expect(body).not.toContain('wt/01-architect"');
  });
  test('grant expiry = approval window + run timeout + grace, capped under 12h', async () => {
    const a = api(false);
    const t0 = Date.now();
    await fanOut([w(['CLAS ZCL_A'])], 'codex', { root, runId: 'ge1', grantApi: a, grantWindowMs: 10 * 60_000, timeoutMs: 5 * 60_000, killGraceMs: 60_000 }).catch(() => {});
    const d = Date.parse(a.reqs[0].expiresAt) - t0;
    expect(d).toBeGreaterThan(15.9 * 60_000); expect(d).toBeLessThan(16.1 * 60_000);
    const b = api(false);
    await fanOut([w(['CLAS ZCL_A'])], 'codex', { root, runId: 'ge2', grantApi: b, grantWindowMs: 20 * 3_600_000 }).catch(() => {});
    expect(Date.parse(b.reqs[0].expiresAt) - Date.now()).toBeLessThan(12 * 3_600_000);
  });
});

describe('real proxy integration (stub vsp, no SAP)', () => {
  test('tools/list works and a write call from a read row is denied', async () => {
    const proot = realpathSync(mkdtempSync(join(tmpdir(), 'dp-root-')));
    const sh = secureHome(proot, { sign: true });
    const argv = proxyArgv(proot, 'R0', undefined, '01-x', 'read');
    const i = argv.indexOf('--');
    const args = [join(REPO, 'scripts', 'sap-mcp-proxy.ts'), ...argv.slice(1, i), '--', process.execPath, join(REPO, 'scripts', 'tests', 'fixtures', 'stub-vsp.ts')];
    const env = { ...buildChildEnv('claude', process.env, { mode: 'read' }), HOME: sh.home, NODE_ENV: 'test' };
    const p = Bun.spawn([process.execPath, ...args], { cwd: proot, env, stdin: 'pipe', stdout: 'pipe', stderr: 'pipe' });
    const send = (o: object) => { p.stdin.write(JSON.stringify(o) + '\n'); p.stdin.flush(); };
    send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '1' } } });
    send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
    send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'SAP', arguments: { action: 'edit', target: 'CLAS ZCL_X', params: { source: 'x' } } } });
    const lines: any[] = [];
    const reader = p.stdout.getReader(); const dec = new TextDecoder(); let buf = '';
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline && !(lines.some(l => l.id === 2) && lines.some(l => l.id === 3))) {
      const r = await Promise.race([reader.read(), Bun.sleep(500).then(() => null)]);
      if (r && !r.done) { buf += dec.decode(r.value); const parts = buf.split('\n'); buf = parts.pop()!; for (const l of parts) { try { lines.push(JSON.parse(l)); } catch { /* skip */ } } }
      if (r && r.done) break;
    }
    p.kill('SIGKILL');
    sh.restore(); rmSync(proot, { recursive: true, force: true });
    const list = lines.find(l => l.id === 2);
    expect(list?.result?.tools?.length ?? 0).toBeGreaterThan(0);
    const call = lines.find(l => l.id === 3);
    expect(JSON.stringify(call)).toContain('DENIED by SAP safety gate');
    expect(JSON.stringify(call)).not.toContain('"isError":false');
  });
});

describe('CLI mode', () => {
  test('antigravity-cli and unknown platform are errors', async () => {
    const plan = join(tmp, 'plan.json'); writeFileSync(plan, JSON.stringify([{ role: 'architect', task: 'x' }]));
    expect(await runPlatformMode(['--platform', 'antigravity-cli', '--plan', plan], root)).toBe(1);
    expect(await runPlatformMode(['--platform', 'nope', '--plan', plan], root)).toBe(1);
    expect(await runPlatformMode(['--platform', 'codex'], root)).toBe(1);
  });
  test('dry-run spawns nothing', async () => {
    const plan = join(tmp, 'plan2.json'); writeFileSync(plan, JSON.stringify([{ role: 'architect', task: 'x', tier: 'high' }]));
    expect(await runPlatformMode(['--platform', 'codex', '--plan', plan, '--dry-run'], root)).toBe(0);
    expect(existsSync(join(root, 'memory', 'dispatch', 'dry'))).toBe(false);
    expect(existsSync(join(root, 'memory', 'dispatch', 'summary.json'))).toBe(false);
  });
});

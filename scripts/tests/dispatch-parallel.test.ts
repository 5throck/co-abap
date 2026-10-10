/** @version 1.0.0 */
import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildAdapter, buildPrompt, fanOut, parsePlan, resolveModel, runPlatformMode } from '../dispatch-parallel.ts';

const REPO = join(import.meta.dir, '..', '..');
let tmp: string, root: string, bin: string, oldPath: string | undefined;

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
  const common = 'echo "start $$" >> "$STUB_LOG"; PROMPT=$(cat); sleep 0.4; echo "end $$" >> "$STUB_LOG"';
  stub('codex', `${common}\nOUT=""; while [ $# -gt 0 ]; do [ "$1" = "-o" ] && OUT="$2"; ARGS="$ARGS $1"; shift; done\necho "ARGS:$ARGS" > "$OUT"; printf '%s' "$PROMPT" >> "$OUT"`);
  stub('gemini', `${common}\necho "ARGS:$*"; printf '%s' "$PROMPT"`);
  stub('claude', `${common}\necho "ARGS:$*"; printf '%s' "$PROMPT"`);
  stub('hermes', `echo "start $$" >> "$STUB_LOG"; echo "ARGS:$1"; printf '%s' "$2"`);
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
    expect(buildPrompt(tasks[1], root)).toBe('You are the auditor.\n\n## Task\n\nT2\n\n## Context\n\n- ctx\n\n## Output format\n\nmarkdown\n');
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
    const log = join(tmp, 'codex.log'); writeFileSync(log, ''); process.env.STUB_LOG = log;
    const { results, runDir } = await fanOut(tasks, 'codex', { root, outDir: join(tmp, 'out'), runId: 'r1', maxParallel: 3 });
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
    const log = join(tmp, 'ser.log'); writeFileSync(log, ''); process.env.STUB_LOG = log;
    await fanOut(tasks.slice(0, 2), 'gemini', { root, outDir: join(tmp, 'out'), runId: 'r2', maxParallel: 1 });
    expect(readFileSync(log, 'utf-8').trim().split('\n').map(l => l.split(' ')[0])).toEqual(['start', 'end', 'start', 'end']);
  });
  test('gemini, claude, hermes get identical prompt text', async () => {
    process.env.STUB_LOG = join(tmp, 'x.log');
    const expected = buildPrompt(tasks[0], root);
    for (const plat of ['gemini', 'claude', 'hermes'] as const) {
      const { results } = await fanOut([tasks[0]], plat, { root, outDir: join(tmp, 'out'), runId: `id-${plat}` });
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
      const slow = await fanOut(tasks.slice(0, 2), 'codex', { root, outDir: join(tmp, 'out'), runId: 'r3', timeoutMs: 300 });
      expect(slow.results.every(r => r.status === 'timeout')).toBe(true);
      expect(Date.now() - t0).toBeLessThan(4000);
      const bad = await fanOut([tasks[0], { ...tasks[0], role: 'nonexistent' }], 'gemini', { root, outDir: join(tmp, 'out'), runId: 'r4' });
      expect(bad.results.map(r => r.status)).toEqual(['failed', 'error']);
      expect(bad.results[0].exitCode).toBe(3);
      expect(readFileSync(bad.results[0].file, 'utf-8')).toContain('boom');
    } finally { process.env.PATH = saved; }
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
    expect(existsSync(join(root, 'memory'))).toBe(false);
  });
});

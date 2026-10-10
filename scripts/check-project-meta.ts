#!/usr/bin/env bun
/**
 * Project metadata checks (CHANGELOG structure, lifecycle metadata bumps)
 * @version 1.0.0
 *
 * a. CHANGELOG.md has exactly one `## [Unreleased]`, and it is the first `## ` heading.
 * b. Entries under [Unreleased] follow docs/context.md "CHANGELOG Entry Format".
 *    Entries dated on/after 2026-10-11 must sit under a Keep-a-Changelog `###`
 *    subheading and carry a `(#PR)` reference (older flat history is grandfathered).
 * c. (date-only `last_updated`/`last_reviewed` diffs need no version bump) agents/*.md and skills/<name>/SKILL.md changed vs the merge-base with origin/main
 *    must bump frontmatter `version` and keep `last_updated` >= latest commit date.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = join(import.meta.dir, '..');
export const ENFORCE_FROM = '2026-10-11';
const CATEGORIES = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];

export interface Result { status: 'PASS' | 'FAIL' | 'SKIP'; label: string; details: string[]; }

export function checkChangelogStructure(text: string): Result {
  const heads = text.split(/\r?\n/).filter(l => /^## /.test(l));
  const unrel = heads.filter(l => /^## \[Unreleased\]\s*$/i.test(l));
  const details: string[] = [];
  if (unrel.length !== 1) details.push(`expected exactly one "## [Unreleased]" heading, found ${unrel.length}`);
  else if (heads[0] !== unrel[0]) details.push(`"## [Unreleased]" must be the first "## " heading, found "${heads[0]}" first`);
  return { status: details.length ? 'FAIL' : 'PASS', label: 'changelog-unreleased-heading', details };
}

export function checkChangelogEntries(text: string): Result {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex(l => /^## \[Unreleased\]\s*$/i.test(l));
  const details: string[] = [];
  if (start < 0) return { status: 'FAIL', label: 'changelog-entry-format', details: ['no [Unreleased] section'] };
  let sub: string | null = null;
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^## /.test(l)) break;
    const h = l.match(/^### (.+?)\s*$/);
    if (h) {
      sub = h[1];
      if (!CATEGORIES.includes(sub)) details.push(`line ${i + 1}: unknown subheading "### ${sub}"`);
      continue;
    }
    if (!/^- /.test(l)) continue;
    const date = l.match(/\[(\d{4}-\d{2}-\d{2})\]/)?.[1];
    if (!date || date < ENFORCE_FROM) continue;
    if (!sub) details.push(`line ${i + 1}: entry dated ${date} is not under a ### category subheading`);
    if (!/\(#\d+\)|\(#PR[^)]*\)/.test(l)) details.push(`line ${i + 1}: entry dated ${date} lacks a (#PR) reference`);
  }
  return { status: details.length ? 'FAIL' : 'PASS', label: 'changelog-entry-format', details };
}

export function parseFrontmatter(text: string): Record<string, string> {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const out: Record<string, string> = {};
  if (!m) return out;
  let inLifecycle = false;
  for (const raw of m[1].split(/\r?\n/)) {
    if (/^lifecycle:\s*$/.test(raw)) { inLifecycle = true; continue; }
    if (/^\S/.test(raw)) inLifecycle = false;
    const kv = raw.match(/^(\s*)([A-Za-z_]+):\s*["']?([^"'#]*?)["']?\s*$/);
    if (!kv) continue;
    if (kv[2] === 'version' && !kv[1]) out.version = kv[3];
    if (kv[2] === 'last_updated') out[inLifecycle && kv[1] ? 'lifecycle.last_updated' : 'last_updated'] = kv[3];
  }
  return out;
}

/** Strip lifecycle date lines so date-only diffs are not treated as content changes. */
export function stripDateLines(text: string): string {
  return text.replace(/\r\n/g, '\n').split('\n').filter(l => !/^\s*(last_updated|last_reviewed):/.test(l)).join('\n').trimEnd();
}

export function checkFileMeta(file: string, current: string, base: string | null, commitDate: string | null): string[] {
  const cur = parseFrontmatter(current);
  const issues: string[] = [];
  if (base !== null && cur.version) {
    const b = parseFrontmatter(base);
    if (b.version && b.version === cur.version && stripDateLines(current) !== stripDateLines(base)) issues.push(`${file}: version ${cur.version} unchanged vs merge-base`);
  }
  for (const key of ['last_updated', 'lifecycle.last_updated']) {
    if (cur[key] && commitDate && cur[key] < commitDate) {
      issues.push(`${file}: ${key} ${cur[key]} is older than latest commit date ${commitDate}`);
    }
  }
  return issues;
}

function git(args: string[]): { ok: boolean; out: string } {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf-8' });
  return { ok: r.status === 0, out: (r.stdout ?? '').trim() };
}

function checkLifecycleMeta(): Result {
  const label = 'lifecycle-metadata';
  const mb = git(['merge-base', 'HEAD', 'origin/main']);
  if (!mb.ok || !mb.out) return { status: 'SKIP', label, details: ['no origin/main merge-base available'] };
  const diff = git(['diff', '--name-only', '--diff-filter=AM', mb.out]);
  const files = diff.out.split('\n').filter(f => /^agents\/[^/]+\.md$/.test(f) || /^skills\/[^/]+\/SKILL\.md$/.test(f));
  const details: string[] = [];
  for (const f of files) {
    if (!existsSync(join(ROOT, f))) continue;
    const baseShow = git(['show', `${mb.out}:${f}`]);
    const date = git(['log', '-1', '--format=%cs', '--', f]).out || null;
    details.push(...checkFileMeta(f, readFileSync(join(ROOT, f), 'utf-8'), baseShow.ok ? baseShow.out : null, date));
  }
  return { status: details.length ? 'FAIL' : 'PASS', label: `${label} (${files.length} changed file(s))`, details };
}

function run(): number {
  const cl = join(ROOT, 'CHANGELOG.md');
  const results: Result[] = [];
  if (!existsSync(cl)) results.push({ status: 'FAIL', label: 'changelog', details: ['CHANGELOG.md missing'] });
  else {
    const text = readFileSync(cl, 'utf-8');
    results.push(checkChangelogStructure(text), checkChangelogEntries(text));
  }
  results.push(checkLifecycleMeta());
  let fails = 0;
  for (const r of results) {
    console.log(`[${r.status}] ${r.label}`);
    for (const d of r.details) console.log(`  - ${d}`);
    if (r.status === 'FAIL') fails++;
  }
  return fails ? 1 : 0;
}

if (import.meta.main) process.exit(run());

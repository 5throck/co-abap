#!/usr/bin/env bun
/**
 * L3 Project Review Baseline
 * @version 1.0.0
 *
 * Runs only the deterministic checks delivered to a detached L3 project.
 * L0 source-tree checks (templates and propagation) are reported N/A rather
 * than being treated as passes or failures.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = join(import.meta.dir, '..');
const quiet = process.argv.includes('--quiet');

export function isDetachedL3Project(root: string): boolean {
  return !existsSync(join(root, 'templates'))
    && existsSync(join(root, '.claude', 'template-version.txt'))
    && existsSync(join(root, 'docs', 'context.md'));
}

interface BaselineCheck {
  name: string;
  command?: string[];
  naReason?: string;
}

export function l3BaselineChecks(): BaselineCheck[] {
  return [
    { name: 'audit', command: ['scripts/audit.ts'] },
    { name: 'verify-scripts', command: ['scripts/verify-scripts.ts', '--verify'] },
    { name: 'agent-lifecycle-audit', command: ['scripts/agent-lifecycle-audit.ts'] },
    { name: 'skill-lifecycle-audit', command: ['scripts/skill-lifecycle-audit.ts'] },
    { name: 'typecheck', command: ['run', 'typecheck'] },
    {
      name: 'validate-templates',
      naReason: 'L0-only template source tree is intentionally absent from this detached L3 project.',
    },
    {
      name: 'propagate-to-templates',
      naReason: 'L0-only propagation tooling is not delivered to detached L3 projects.',
    },
  ];
}

function run(): number {
  if (!isDetachedL3Project(ROOT)) {
    console.error('[ERROR] review-baseline.ts is for detached L3 projects only; use the workspace project-review battery when templates/ is available.');
    return 1;
  }

  let failures = 0;
  for (const check of l3BaselineChecks()) {
    if (check.naReason) {
      console.log(`[N/A] ${check.name}: ${check.naReason}`);
      continue;
    }
    const result = spawnSync('bun', check.command!, {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: quiet ? 'pipe' : 'inherit',
    });
    const passed = result.status === 0 && !result.error;
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${check.name}`);
    if (!passed) failures++;
  }
  console.log(`L3 review baseline: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} failing applicable check(s))`);
  return failures === 0 ? 0 : 1;
}

if (import.meta.main) process.exit(run());

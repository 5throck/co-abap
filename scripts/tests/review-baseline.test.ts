/**
 * @version 1.3.0
 */
import { describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { isDetachedL3Project, l3BaselineChecks } from '../review-baseline.ts';

function makeFixture(files: string[] = ['template-version.txt']): string {
  const root = join(tmpdir(), `l3-baseline-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(join(root, 'docs'), { recursive: true });
  writeFileSync(join(root, 'docs', 'context.md'), '# context\n');
  for (const f of files) {
    mkdirSync(join(root, f, '..'), { recursive: true });
    writeFileSync(join(root, f), 'x\n');
  }
  return root;
}

function withFixture(files: string[], fn: (root: string) => void): void {
  const root = makeFixture(files);
  try { fn(root); } finally { rmSync(root, { recursive: true, force: true }); }
}

describe('review-baseline L3 detection', () => {
  test('detects the root template-version.txt marker (no .claude/ directory)', () => {
    withFixture(['template-version.txt'], root => {
      expect(existsSync(join(root, '.claude'))).toBe(false);
      expect(isDetachedL3Project(root)).toBe(true);
    });
  });

  test('does not detect with only .claude/template-version.txt', () => {
    withFixture(['.claude/template-version.txt'], root => expect(isDetachedL3Project(root)).toBe(false));
  });

  test('does not detect with only .claude/last-upgrade-delivery.json', () => {
    withFixture(['.claude/last-upgrade-delivery.json'], root => expect(isDetachedL3Project(root)).toBe(false));
  });

  test('does not detect when templates/ exists', () => {
    withFixture(['template-version.txt'], root => {
      mkdirSync(join(root, 'templates'));
      expect(isDetachedL3Project(root)).toBe(false);
    });
  });

  test('does not detect without docs/context.md', () => {
    withFixture(['template-version.txt'], root => {
      rmSync(join(root, 'docs', 'context.md'));
      expect(isDetachedL3Project(root)).toBe(false);
    });
  });
});

describe('review-baseline checks', () => {
  test('L0-only checks are reported N/A', () => {
    expect(l3BaselineChecks().filter(c => c.naReason).map(c => c.name))
      .toEqual(['validate-templates', 'propagate-to-templates']);
  });
});

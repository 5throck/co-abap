/**
 * @version 1.2.0
 */
import { describe, expect, test } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { isDetachedL3Project, l3BaselineChecks } from '../review-baseline.ts';

function makeDetachedL3Fixture(marker = 'template-version.txt'): string {
  const root = join(tmpdir(), `l3-baseline-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(join(root, '.claude'), { recursive: true });
  mkdirSync(join(root, 'docs'), { recursive: true });
  writeFileSync(join(root, '.claude', marker), marker.endsWith('.json') ? '{}\n' : 'variant=co-abap\n');
  writeFileSync(join(root, 'docs', 'context.md'), '# context\n');
  return root;
}

describe('review-baseline L3 detection', () => {
  test('accepts either provenance marker and rejects when templates/ exists', () => {
    for (const marker of ['template-version.txt', 'last-upgrade-delivery.json']) {
      const root = makeDetachedL3Fixture(marker);
      try {
        expect(isDetachedL3Project(root)).toBe(true);
        mkdirSync(join(root, 'templates'));
        expect(isDetachedL3Project(root)).toBe(false);
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    }
  });

  test('rejects a project with no provenance marker', () => {
    const root = makeDetachedL3Fixture();
    rmSync(join(root, '.claude', 'template-version.txt'));
    try {
      expect(isDetachedL3Project(root)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('L0-only checks are reported N/A', () => {
    expect(l3BaselineChecks().filter(c => c.naReason).map(c => c.name))
      .toEqual(['validate-templates', 'propagate-to-templates']);
  });
});

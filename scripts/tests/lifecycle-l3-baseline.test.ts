/**
 * @version 1.0.0
 */
import { describe, expect, test } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { isDetachedL3Project as templateIsDetachedL3, templateValidationDisposition } from '../validate-templates.ts';
import { findAgentFiles } from '../agent-lifecycle-audit.ts';
import { l3LifecyclePolicy } from '../skill-lifecycle-audit.ts';
import { isDetachedL3Project as baselineIsDetachedL3, l3BaselineChecks } from '../review-baseline.ts';

function makeDetachedL3Fixture(): string {
  const root = join(tmpdir(), `l3-lifecycle-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(join(root, '.claude'), { recursive: true });
  mkdirSync(join(root, 'docs'), { recursive: true });
  writeFileSync(join(root, '.claude', 'template-version.txt'), 'variant=co-abap\n');
  writeFileSync(join(root, 'docs', 'context.md'), '# context\n');
  return root;
}

describe('L3 lifecycle baseline policy', () => {
  test('detached L3 projects skip template validation only with provenance markers', () => {
    const root = makeDetachedL3Fixture();
    try {
      expect(templateIsDetachedL3(root)).toBe(true);
      expect(baselineIsDetachedL3(root)).toBe(true);
      expect(templateValidationDisposition(root)).toBe('skip-detached-l3');
      mkdirSync(join(root, 'templates'));
      expect(templateIsDetachedL3(root)).toBe(false);
      expect(templateValidationDisposition(root)).toBe('validate');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('missing templates remain an error outside a proven L3 project', () => {
    const root = join(tmpdir(), `non-l3-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    mkdirSync(root);
    try {
      expect(templateValidationDisposition(root)).toBe('error-missing-templates');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('agent discovery includes frontmatter-only pm extends stubs', () => {
    const root = makeDetachedL3Fixture();
    const agents = join(root, 'agents');
    mkdirSync(agents);
    writeFileSync(join(agents, 'pm.md'), '---\nextends: ../../common/agents/pm.md\nname: pm\n---\n');
    writeFileSync(join(agents, 'notes.md'), '# not an agent\n');
    try {
      expect(findAgentFiles(agents).map(file => file.replace(/\\/g, '/'))).toContain(join(agents, 'pm.md').replace(/\\/g, '/'));
      expect(findAgentFiles(agents)).toHaveLength(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('L3 policy makes L0 lifecycle evidence explicitly not applicable', () => {
    const root = makeDetachedL3Fixture();
    try {
      expect(l3LifecyclePolicy(root)).toMatchObject({
        detachedL3: true,
        requireLifecycleRecords: false,
        requireLocalFreshness: false,
      });
      expect(l3BaselineChecks().filter(check => check.naReason).map(check => check.name))
        .toEqual(['validate-templates', 'propagate-to-templates']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

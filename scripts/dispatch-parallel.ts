#!/usr/bin/env bun
/**
 * Parallel Agent Dispatcher
 * @version 2.0.0
 * Automates dispatching multiple read-only subagents simultaneously.
 * With --platform it fans out real CLI processes (codex, gemini, claude, hermes)
 * per cross-platform-parity design section 5.1; without it, legacy dry-run behavior.
 *
 * This dispatcher is optimized for tasks that can run independently:
 * - Codebase analysis
 * - Documentation generation
 * - Health checks
 * - Parallel investigation
 *
 * @module dispatch-parallel
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '..');

export type Tier = 'high' | 'medium' | 'low';
export const PLATFORMS = ['claude', 'codex', 'gemini', 'hermes', 'antigravity-cli'] as const;
export type Platform = (typeof PLATFORMS)[number];

interface ParallelAgentTask {
  tier?: Tier;
  description: string;
  role: string;
  task: string;
  context?: string[];
  outputFormat?: string;
  priority?: 'high' | 'medium' | 'low';
}

interface DispatchResult {
  task: ParallelAgentTask;
  status: 'dispatched' | 'completed' | 'failed';
  output?: string;
  error?: string;
  timestamp: Date;
}

interface DispatchOptions {
  dryRun?: boolean;
  platform?: Platform;
  maxParallel?: number;
  timeoutMs?: number;
  outDir?: string;
  runId?: string;
  root?: string;
  /** Test hook: override the model lookup file. */
  schemaPath?: string;
}

/**
 * Default parallel agent configurations for workspace workflows.
 * Roles map to agent definitions in agents/ directory.
 */
const defaultTasks: ParallelAgentTask[] = [
  {
    description: "Codebase analysis",
    role: "architect",
    task: "Analyze the codebase structure and identify key patterns",
    context: [
      "Look for architectural patterns",
      "Identify dependencies between components",
      "Check for code quality issues"
    ],
    outputFormat: "markdown",
    priority: "high"
  },
  {
    description: "Documentation audit",
    role: "docs-writer",
    task: "Audit all documentation files for consistency and completeness",
    context: [
      "Check CLAUDE.md files",
      "Verify README.md completeness",
      "Check AGENTS.md accuracy"
    ],
    outputFormat: "json",
    priority: "medium"
  },
  {
    description: "Security review",
    role: "security-expert",
    task: "Run security checks on the project",
    context: [
      "Scan for secrets or unsafe patterns",
      "Check dependency vulnerabilities",
      "Validate permission configurations"
    ],
    outputFormat: "markdown",
    priority: "high"
  },
  {
    description: "Quality gate audit",
    role: "auditor",
    task: "Run bun scripts/audit.ts and report all findings",
    context: [
      "Run full workspace audit",
      "Check lifecycle sync",
      "Verify skill definitions"
    ],
    outputFormat: "markdown",
    priority: "low"
  }
];


// ─── Real fan-out engine (design section 5.1) ───

/** Platform name -> docs/workspace-schema.json models key. */
const SCHEMA_KEY: Record<Platform, string> = {
  claude: 'claude',
  codex: 'codex',
  gemini: 'gemini-cli',
  hermes: 'hermes',
  'antigravity-cli': 'antigravity-cli',
};
/** Claude Code takes short aliases (CLAUDE.md section 5), not registry IDs. */
const CLAUDE_ALIAS: Record<Tier, string> = { high: 'opus', medium: 'sonnet', low: 'haiku' };
const TIERS: readonly string[] = ['high', 'medium', 'low'];

export function assertPlatform(p: string): Platform {
  if (!(PLATFORMS as readonly string[]).includes(p)) {
    throw new Error(`Unknown platform "${p}". Expected one of: ${PLATFORMS.join(', ')}`);
  }
  return p as Platform;
}

export function resolveModel(platform: Platform, tier: string, schemaPath = join(ROOT, 'docs', 'workspace-schema.json')): string {
  if (!TIERS.includes(tier)) throw new Error(`Unknown tier "${tier}". Expected high|medium|low`);
  if (platform === 'antigravity-cli') {
    throw new Error('antigravity-cli adapter pending verification (Phase 0): command, flags and model keys are not confirmed, so no process is spawned.');
  }
  if (platform === 'claude') return CLAUDE_ALIAS[tier as Tier];
  const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
  const model = schema?.models?.[SCHEMA_KEY[platform]]?.[tier];
  if (!model) throw new Error(`No model for platform "${platform}" tier "${tier}" in docs/workspace-schema.json (models.${SCHEMA_KEY[platform]})`);
  return model;
}

/** Strip a leading YAML frontmatter block. */
function stripFrontmatter(text: string): string {
  const t = text.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  if (!t.startsWith('---\n')) return t;
  const end = t.indexOf('\n---', 4);
  if (end < 0) return t;
  const nl = t.indexOf('\n', end + 4);
  return nl < 0 ? '' : t.slice(nl + 1);
}

/** Identical on every platform: agents/<role>.md body + task + context + output format. */
export function buildPrompt(task: ParallelAgentTask, root = ROOT): string {
  if (!/^[A-Za-z0-9._-]+$/.test(task.role)) throw new Error(`Invalid role name "${task.role}"`);
  const roleFile = join(root, 'agents', `${task.role}.md`);
  if (!existsSync(roleFile)) throw new Error(`Role definition not found: agents/${task.role}.md`);
  const body = stripFrontmatter(readFileSync(roleFile, 'utf-8')).trim();
  const parts = [body, '', '## Task', '', task.task];
  if (task.context && task.context.length > 0) parts.push('', '## Context', '', ...task.context.map(c => `- ${c}`));
  if (task.outputFormat) parts.push('', '## Output format', '', task.outputFormat);
  return parts.join('\n') + '\n';
}

export interface Adapter {
  cmd: string[];
  stdin?: string;
  /** When set, the final answer is read from this file instead of stdout. */
  outputFile?: string;
}

export function buildAdapter(platform: Platform, model: string, prompt: string, root: string, outputFile: string): Adapter {
  switch (platform) {
    case 'codex':
      return { cmd: ['codex', 'exec', '-m', model, '-s', 'read-only', '-C', root, '--skip-git-repo-check', '-o', outputFile, '-'], stdin: prompt, outputFile };
    case 'gemini':
      return { cmd: ['gemini', '-m', model, '--approval-mode', 'plan', '-o', 'text', '-p', 'Follow the instructions provided on stdin.'], stdin: prompt };
    case 'claude':
      return { cmd: ['claude', '-p', '--model', model, '--permission-mode', 'plan'], stdin: prompt };
    case 'hermes':
      // No verified read-only flag (Phase 0): the abap proxy still enforces SAP policy; rows must be read-only by plan.
      // Model flag unverified: the tier model is recorded in summary.json but not passed.
      return { cmd: ['hermes', '-z', prompt] };
    default:
      throw new Error('antigravity-cli adapter pending verification (Phase 0).');
  }
}

export type RowStatus = 'completed' | 'failed' | 'timeout' | 'error';
export interface RowResult {
  index: number;
  role: string;
  platform: Platform;
  model: string;
  status: RowStatus;
  durationMs: number;
  exitCode: number | null;
  file: string;
  error?: string;
}

/** Plan file: JSON array, or a markdown table with role | task | tier columns. */
export function parsePlan(file: string): ParallelAgentTask[] {
  const text = readFileSync(file, 'utf-8');
  let rows: any[];
  if (file.endsWith('.json') || text.trimStart().startsWith('[') || text.trimStart().startsWith('{')) {
    const parsed = JSON.parse(text);
    rows = Array.isArray(parsed) ? parsed : parsed.rows ?? parsed.tasks;
    if (!Array.isArray(rows)) throw new Error('Plan JSON must be an array of rows or {rows: [...]}');
  } else {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.startsWith('|'));
    if (lines.length < 3) throw new Error('Plan markdown must contain a table with a header row');
    const cells = (l: string) => l.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
    const header = cells(lines[0]).map(h => h.toLowerCase());
    const col = (n: string) => header.indexOf(n);
    if (col('role') < 0 || col('task') < 0) throw new Error('Plan table needs role and task columns');
    rows = lines.slice(2).map(l => {
      const c = cells(l);
      return { role: c[col('role')], task: c[col('task')], tier: col('tier') >= 0 ? c[col('tier')] : undefined };
    });
  }
  return rows.map((r, i) => {
    if (!r || typeof r.role !== 'string' || typeof r.task !== 'string' || !r.role || !r.task) {
      throw new Error(`Plan row ${i + 1}: role and task are required`);
    }
    const tier = (r.tier ?? 'medium').toString().toLowerCase();
    if (!TIERS.includes(tier)) throw new Error(`Plan row ${i + 1}: unknown tier "${tier}"`);
    return {
      description: r.description ?? r.task.slice(0, 40),
      role: r.role,
      task: r.task,
      context: Array.isArray(r.context) ? r.context : undefined,
      outputFormat: r.outputFormat,
      tier: tier as Tier,
    };
  });
}

async function runRow(
  index: number, task: ParallelAgentTask, platform: Platform, runDir: string, o: Required<Pick<DispatchOptions, 'timeoutMs' | 'root' | 'schemaPath'>>,
): Promise<RowResult> {
  const start = Date.now();
  const tier = task.tier ?? 'medium';
  const base = `${String(index + 1).padStart(2, '0')}-${task.role}`;
  const file = join(runDir, `${base}.md`);
  let model = '';
  const finish = (status: RowStatus, exitCode: number | null, body: string, error?: string): RowResult => {
    const durationMs = Date.now() - start;
    const header = `---\nrole: ${task.role}\nplatform: ${platform}\nmodel: ${model}\ntier: ${tier}\nstatus: ${status}\nexit_code: ${exitCode}\nduration_ms: ${durationMs}\n---\n\n`;
    writeFileSync(file, header + body + (error ? `\n\n## Error\n\n${error}\n` : ''));
    return { index: index + 1, role: task.role, platform, model, status, durationMs, exitCode, file, error };
  };
  try {
    model = resolveModel(platform, tier, o.schemaPath);
    const prompt = buildPrompt(task, o.root);
    const adapter = buildAdapter(platform, model, prompt, o.root, join(runDir, `${base}.last.txt`));
    const proc = Bun.spawn(adapter.cmd, {
      cwd: o.root, env: process.env,
      stdin: adapter.stdin !== undefined ? new TextEncoder().encode(adapter.stdin) : 'ignore',
      stdout: 'pipe', stderr: 'pipe',
    });
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; proc.kill(); }, o.timeoutMs);
    const outs = Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);
    const code = await proc.exited;
    clearTimeout(timer);
    // Grandchildren may keep the pipes open after a kill; do not wait for them indefinitely.
    const [stdout, stderr] = await Promise.race([outs, new Promise<[string, string]>(r => setTimeout(() => r(['', '']), timedOut ? 1500 : 60_000))]);
    let out = stdout;
    if (adapter.outputFile && existsSync(adapter.outputFile)) out = readFileSync(adapter.outputFile, 'utf-8');
    if (timedOut) return finish('timeout', code, out, `Timed out after ${o.timeoutMs}ms. stderr:\n${stderr.slice(-2000)}`);
    if (code !== 0) return finish('failed', code, out, `Exit code ${code}. stderr:\n${stderr.slice(-2000)}`);
    return finish('completed', code, out);
  } catch (e) {
    return finish('error', null, '', e instanceof Error ? e.message : String(e));
  }
}

/** Run rows on a platform CLI with bounded concurrency; one failure never cancels others. */
export async function fanOut(tasks: ParallelAgentTask[], platform: Platform, options: DispatchOptions = {}): Promise<{ runId: string; runDir: string; results: RowResult[] }> {
  const root = options.root ?? ROOT;
  const schemaPath = options.schemaPath ?? join(root, 'docs', 'workspace-schema.json');
  const runId = options.runId ?? new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = join(options.outDir ?? join(root, 'memory', 'dispatch'), runId);
  mkdirSync(runDir, { recursive: true });
  const max = Math.max(1, options.maxParallel ?? 4);
  const timeoutMs = options.timeoutMs ?? 600_000;
  const slots: Promise<RowResult>[] = new Array(tasks.length);
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const i = next++;
      slots[i] = runRow(i, tasks[i], platform, runDir, { timeoutMs, root, schemaPath });
      await slots[i];
    }
  };
  await Promise.allSettled(Array.from({ length: Math.min(max, tasks.length) }, worker));
  const results = await Promise.all(slots);
  writeFileSync(join(runDir, 'summary.json'), JSON.stringify({ runId, platform, results: results.map(r => ({ ...r, file: r.file.replace(runDir + '/', '') })) }, null, 2) + '\n');
  return { runId, runDir, results };
}

function printTable(results: RowResult[]): void {
  console.log('\n| # | role | platform | model | status | ms | exit |');
  console.log('|---|------|----------|-------|--------|----|------|');
  for (const r of results) console.log(`| ${r.index} | ${r.role} | ${r.platform} | ${r.model} | ${r.status} | ${r.durationMs} | ${r.exitCode ?? '-'} |`);
}

function flagValue(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

/** Platform mode entry (used by runCli and dispatch.ts). Returns the process exit code. */
export async function runPlatformMode(args: string[], root = ROOT): Promise<number> {
  try {
    const platform = assertPlatform(flagValue(args, '--platform') ?? '');
    const planFile = flagValue(args, '--plan');
    if (!planFile) throw new Error('--plan <file> is required with --platform');
    const tasks = parsePlan(resolve(planFile));
    const maxParallel = Number(flagValue(args, '--max-parallel') ?? 4);
    const timeoutMs = Number(flagValue(args, '--timeout') ?? 600) * 1000;
    if (!Number.isFinite(maxParallel) || maxParallel < 1) throw new Error('--max-parallel must be >= 1');
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('--timeout must be seconds > 0');
    const schemaPath = join(root, 'docs', 'workspace-schema.json');
    // Validate every row up front: unknown tier/platform and missing roles are errors before any spawn.
    for (const t of tasks) { resolveModel(platform, t.tier ?? 'medium', schemaPath); buildPrompt(t, root); }
    if (args.includes('--dry-run')) {
      tasks.forEach((t, i) => {
        const model = resolveModel(platform, t.tier ?? 'medium', schemaPath);
        const a = buildAdapter(platform, model, buildPrompt(t, root), root, '<out>');
        const shown = a.cmd.map(c => (c.length > 80 ? `<${c.length} chars>` : c));
        console.log(`[dry-run] ${i + 1}. ${t.role} (${t.tier ?? 'medium'}): ${shown.join(' ')}${a.stdin !== undefined ? ' < prompt' : ''}`);
      });
      return 0;
    }
    const { runId, runDir, results } = await fanOut(tasks, platform, { maxParallel, timeoutMs, root, outDir: flagValue(args, '--out-dir') });
    printTable(results);
    console.log(`\nRun ${runId}: ${runDir}`);
    return results.every(r => r.status === 'completed') ? 0 : 1;
  } catch (e) {
    console.error(`[dispatch-parallel] ${e instanceof Error ? e.message : String(e)}`);
    return 1;
  }
}

/**
 * Dispatch a single agent task
 * In production, this would invoke the Agent tool or call the appropriate API
 */
async function dispatchAgent(task: ParallelAgentTask, options: DispatchOptions = {}): Promise<DispatchResult> {
  const startTime = Date.now();

  try {
    console.log(`   [${task.priority || 'medium'}] ${task.description}`);
    console.log(`   Role: ${task.role}`);
    console.log(`   Task: ${task.task.substring(0, 60)}${task.task.length > 60 ? '...' : ''}`);

    const elapsed = Date.now() - startTime;

    if (options.dryRun) {
      console.log(`   ✅ Dry run accepted (${elapsed}ms)\n`);
      return {
        task,
        status: 'completed',
        output: 'dry-run',
        timestamp: new Date()
      };
    }

    const errMsg = 'CLI dispatch cannot invoke the host Agent tool. Run with --dry-run, or dispatch this task from the PM/orchestrator session.';
    console.log(`   ❌ Failed: ${errMsg} (${elapsed}ms)\n`);
      return {
        task,
        status: 'failed',
        error: errMsg,
        timestamp: new Date()
      };
  } catch (error) {
    return {
      task,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date()
    };
  }
}

/**
 * Dispatch multiple agents in parallel and await all results
 */
export async function dispatchParallel(tasks: ParallelAgentTask[], options: DispatchOptions = {}): Promise<DispatchResult[]> {
  console.log(`\n🚀 Parallel Agent Dispatcher`);
  console.log(`📊 Dispatching ${tasks.length} agents simultaneously\n`);
  console.log(`━${'━'.repeat(60)}`);

  const startTime = Date.now();

  // Sort by priority and dispatch in parallel
  const prioritizedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return (priorityOrder[a.priority || 'medium'] ?? 1) - (priorityOrder[b.priority || 'medium'] ?? 1);
  });

  const results = await Promise.all(
    prioritizedTasks.map(task => dispatchAgent(task, options))
  );

  const elapsed = Date.now() - startTime;
  const completed = results.filter(r => r.status === 'completed').length;
  const failed = results.filter(r => r.status === 'failed').length;

  console.log(`━${'━'.repeat(60)}`);
  console.log(`\n📊 Results:`);
  console.log(`   ✅ Completed: ${completed}/${tasks.length}`);
  console.log(`   ❌ Failed: ${failed}/${tasks.length}`);
  console.log(`   ⏱️  Total time: ${elapsed}ms`);
  console.log(`   📈 Average per task: ${Math.round(elapsed / tasks.length)}ms\n`);

  return results;
}

/**
 * CLI entry point, also callable by variant wrappers (ADR-0050 Part 1).
 * `args` defaults to process.argv; `defaults` lets a variant supply its own
 * default task list while reusing the common argument parsing and dispatch.
 */
export async function runCli(
  args: string[] = process.argv.slice(2),
  defaults: ParallelAgentTask[] = defaultTasks
): Promise<void> {
  if (args.includes('--platform') || args.includes('--plan')) {
    process.exit(await runPlatformMode(args));
  }
  const customTasks: ParallelAgentTask[] = [];

  const dryRun = args.includes('--dry-run');

  // Parse custom tasks from command line
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--task' && args[i + 1]) {
      const parts = args[i + 1].split(':');
      if (parts.length >= 3) {
        customTasks.push({
          description: parts[0],
          role: parts[1],
          task: parts[2],
          priority: (parts[3] as any) || 'medium'
        });
      }
      i++;
    }
  }

  const tasksToRun = customTasks.length > 0 ? customTasks : defaults;

  try {
    const results = await dispatchParallel(tasksToRun, { dryRun });
    process.exit(results.some(result => result.status === 'failed') ? 1 : 0);
  } catch (error) {
    console.error('❌ Dispatch failed:', error);
    process.exit(1);
  }
}

/**
 * CLI entry point
 */
async function main() {
  await runCli();
}

/**
 * Export for direct module use - handles empty task array by using defaults
 */
export async function runDispatcher(tasks?: ParallelAgentTask[], options: DispatchOptions = {}): Promise<DispatchResult[]> {
  return dispatchParallel(tasks && tasks.length > 0 ? tasks : defaultTasks, options);
}

// Run if executed directly
if (import.meta.main) {
  main();
}

export { dispatchParallel as default, ParallelAgentTask, DispatchResult, DispatchOptions };


#!/usr/bin/env bun
/**
 * Harness Metrics
 * @version 1.0.0
 *
 * Harness KPI report (design: docs/designs/2026-10-10-sap-write-safety-gate-design.md §8).
 * Usage: bun scripts/harness-metrics.ts [--json] [--root <dir>] [--month YYYY-MM] [--minutes-per-event N] [--out <path>]
 * Writes a file only with --out. Missing inputs yield "no data" / "n/a", never a fabricated number.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

export interface AuditRecord {
  ts?: string;
  tool?: string;
  class?: string;
  decision?: string;
  object?: string;
  transport?: string;
  taskId?: string;
  specId?: string;
  qaResult?: string;
}
export interface EvidenceEntry {
  status?: string;
  lastWriteTs?: string;
  transport?: string;
  chain?: Record<string, { ts?: string; result?: string }>;
}
export interface Metric {
  name: string;
  value: number | string | null; // null = no data
  numerator?: number;
  denominator?: number;
  basis: "measured" | "proxy" | "n/a";
  note: string;
}
export interface Report {
  month: string | null;
  generatedFrom: { auditFiles: number; auditRecords: number; evidenceObjects: number; gitAvailable: boolean };
  kpis: Metric[];
  referenceOnly: { label: string; value: number | string }[];
}

const pct = (n: number, d: number): number | null => (d === 0 ? null : Math.round((n / d) * 1000) / 10);
const isWrite = (r: AuditRecord) => r.class === "R2";

export function parseJsonl(text: string): AuditRecord[] {
  const out: AuditRecord[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line) as AuditRecord); } catch { /* skip malformed line */ }
  }
  return out;
}

export function loadAudit(root: string, month?: string): { records: AuditRecord[]; files: number } {
  const dir = join(root, "memory", "audit");
  if (!existsSync(dir)) return { records: [], files: 0 };
  const files = readdirSync(dir).filter((f) => /^sap-actions-.*\.jsonl$/.test(f) && (!month || f.includes(month)));
  const records = files.flatMap((f) => parseJsonl(readFileSync(join(dir, f), "utf8")));
  return { records, files: files.length };
}

export function loadEvidence(root: string): Record<string, EvidenceEntry> {
  const p = join(root, "memory", "audit", "sap-evidence.json");
  if (!existsSync(p)) return {};
  try { return JSON.parse(readFileSync(p, "utf8")) as Record<string, EvidenceEntry>; } catch { return {}; }
}

export function firstPass(evidence: Record<string, EvidenceEntry>, records: AuditRecord[]): Metric {
  const written = Object.entries(evidence).filter(([, e]) => e.lastWriteTs);
  const failedObjs = new Set(records.filter((r) => r.qaResult === "fail" && r.object).map((r) => r.object!));
  const ok = written.filter(([uri, e]) => {
    const chainFail = Object.values(e.chain ?? {}).some((c) => c.result === "fail");
    return e.status === "passed" && !chainFail && !failedObjs.has(uri);
  }).length;
  return { name: "First-pass success rate", value: pct(ok, written.length), numerator: ok, denominator: written.length, basis: "measured",
    note: "objects `passed` with no failed QA / objects written (evidence + audit)" };
}

export function traceability(records: AuditRecord[]): Metric {
  const writes = records.filter(isWrite);
  const traced = writes.filter((r) => !!r.transport && !!(r.taskId || r.specId)).length;
  return { name: "Traceability coverage", value: pct(traced, writes.length), numerator: traced, denominator: writes.length, basis: "measured",
    note: "R2 writes with transport and task/spec ID / all R2 writes" };
}

export function unsafeRate(records: AuditRecord[]): Metric {
  const attempts = records.filter((r) => r.class === "R2" || r.class === "R3");
  const unsafe = attempts.filter((r) => r.decision === "deny" || r.decision === "rejected" || r.decision === "ask-rejected").length;
  return { name: "Unsafe action rate", value: pct(unsafe, attempts.length), numerator: unsafe, denominator: attempts.length, basis: "measured",
    note: "(deny + ask-rejected) / all R2+R3 attempts" };
}

export function humanIntervention(records: AuditRecord[], minutesPerEvent: number): Metric {
  const events = records.filter((r) => r.decision === "ask" || r.decision === "approved").length;
  return { name: "Human intervention time", value: records.length === 0 ? null : events * minutesPerEvent, numerator: events, basis: "proxy",
    note: `PROXY: ask+approval events x ${minutesPerEvent} min (minutes); real value needs session timestamps` };
}

function git(root: string, args: string[]): string | null {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  return r.status === 0 ? r.stdout : null;
}

export function classifyPrs(subjects: string[]): { merged: number; fixes: number } {
  let merged = 0, fixes = 0;
  for (const s of subjects) {
    const m = s.match(/^Merge pull request #\d+ from \S+?\/(\S+)/);
    if (m) {
      merged++;
      const slug = m[1].replace(/^pr\//, "").replace(/^\d{8}-\d{6}-/, "");
      if (/^fix/i.test(slug)) fixes++;
    } else if (/\(#\d+\)\s*$/.test(s)) {
      merged++;
      if (/^fix(\(.+\))?!?:/i.test(s)) fixes++;
    }
  }
  return { merged, fixes };
}

export function defectEscape(root: string, since?: string): { metric: Metric; gitOk: boolean; commits: number } {
  const range = since ? [`--since=${since}-01`] : [];
  const out = git(root, ["log", "--format=%s", ...range]);
  if (out === null) {
    return { gitOk: false, commits: 0, metric: { name: "Defect escape rate", value: null, basis: "proxy", note: "PROXY: git history unavailable" } };
  }
  const subjects = out.split("\n").filter(Boolean);
  const { merged, fixes } = classifyPrs(subjects);
  const commits = git(root, ["rev-list", "--no-merges", "--count", "HEAD", ...range]);
  return { gitOk: true, commits: commits ? Number(commits.trim()) : subjects.length, metric: { name: "Defect escape rate", value: pct(fixes, merged), numerator: fixes, denominator: merged, basis: "proxy",
    note: "PROXY: merged PRs (merge-commit or squash style) whose branch/title starts with `fix` / merged PRs (post-release dumps not linked yet)" } };
}

export function memoryLogCount(root: string): number {
  const dir = join(root, "memory");
  return existsSync(dir) ? readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f)).length : 0;
}

export function buildReport(root: string, opts: { month?: string; minutesPerEvent?: number } = {}): Report {
  const { records, files } = loadAudit(root, opts.month);
  const evidence = loadEvidence(root);
  const esc = defectEscape(root, opts.month);
  const kpis: Metric[] = [
    firstPass(evidence, records),
    esc.metric,
    traceability(records),
    humanIntervention(records, opts.minutesPerEvent ?? 2),
    { name: "Cost per accepted change", value: "n/a", basis: "n/a", note: "needs usage export (not available)" },
    unsafeRate(records),
  ];
  const toolCalls = records.length;
  return {
    month: opts.month ?? null,
    generatedFrom: { auditFiles: files, auditRecords: records.length, evidenceObjects: Object.keys(evidence).length, gitAvailable: esc.gitOk },
    kpis,
    referenceOnly: [
      { label: "Commits (git, non-merge)", value: esc.commits },
      { label: "Audited SAP tool calls (agent call proxy)", value: toolCalls },
      { label: "Daily memory logs", value: memoryLogCount(root) },
    ],
  };
}

const fmt = (m: Metric): string => {
  if (m.value === null) return "no data";
  if (typeof m.value === "string") return m.value;
  const unit = m.name.startsWith("Human") ? " min" : "%";
  const frac = m.denominator !== undefined ? ` (${m.numerator}/${m.denominator})` : m.numerator !== undefined ? ` (${m.numerator} events)` : "";
  return `${m.value}${unit}${frac}`;
};

export function renderMarkdown(r: Report): string {
  const lines = [`# Harness Metrics${r.month ? ` ${r.month}` : ""}`, "",
    `Inputs: ${r.generatedFrom.auditFiles} audit file(s), ${r.generatedFrom.auditRecords} record(s), ${r.generatedFrom.evidenceObjects} evidence object(s), git ${r.generatedFrom.gitAvailable ? "available" : "unavailable"}.`, "",
    "## KPIs", "", "| KPI | Value | Basis | Note |", "|-----|-------|-------|------|"];
  for (const m of r.kpis) lines.push(`| ${m.name} | ${fmt(m)} | ${m.basis} | ${m.note} |`);
  lines.push("", "## Reference only (NOT KPIs)", "", "| Counter | Value |", "|---------|-------|");
  for (const c of r.referenceOnly) lines.push(`| ${c.label} | ${c.value} |`);
  return lines.join("\n") + "\n";
}

if (import.meta.main) {
  const a = process.argv.slice(2);
  const val = (f: string) => { const i = a.indexOf(f); return i >= 0 ? a[i + 1] : undefined; };
  const report = buildReport(val("--root") ?? process.cwd(), {
    month: val("--month"),
    minutesPerEvent: val("--minutes-per-event") ? Number(val("--minutes-per-event")) : undefined,
  });
  const text = a.includes("--json") ? JSON.stringify(report, null, 2) + "\n" : renderMarkdown(report);
  const out = val("--out");
  if (out) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, text);
  } else process.stdout.write(text);
}

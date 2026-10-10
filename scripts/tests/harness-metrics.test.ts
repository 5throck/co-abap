/**
 * @version 1.0.0
 */
import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildReport, renderMarkdown, parseJsonl, classifyPrs } from "../harness-metrics";

let empty: string, full: string;
beforeAll(() => {
  empty = mkdtempSync(join(tmpdir(), "hm-empty-"));
  full = mkdtempSync(join(tmpdir(), "hm-full-"));
  mkdirSync(join(full, "memory", "audit"), { recursive: true });
  const recs = [
    { class: "R2", decision: "allow", object: "A", transport: "T1", taskId: "T-1" },
    { class: "R2", decision: "ask", object: "B" },
    { class: "R3", decision: "deny", object: "B" },
    { class: "R2", decision: "approved", object: "C", qaResult: "fail" },
    { class: "R0", decision: "allow" },
  ];
  writeFileSync(join(full, "memory", "audit", "sap-actions-2026-10.jsonl"), recs.map((r) => JSON.stringify(r)).join("\n") + "\nnot json\n");
  writeFileSync(join(full, "memory", "audit", "sap-evidence.json"), JSON.stringify({
    A: { status: "passed", lastWriteTs: "t" }, B: { status: "pending", lastWriteTs: "t" }, C: { status: "passed", lastWriteTs: "t" },
  }));
});
afterAll(() => { rmSync(empty, { recursive: true, force: true }); rmSync(full, { recursive: true, force: true }); });

describe("harness-metrics", () => {
  test("no data when inputs are missing", () => {
    const r = buildReport(empty);
    const get = (n: string) => r.kpis.find((k) => k.name.startsWith(n))!;
    expect(get("First-pass").value).toBeNull();
    expect(get("Traceability").value).toBeNull();
    expect(get("Unsafe").value).toBeNull();
    expect(get("Human").value).toBeNull();
    expect(get("Cost").value).toBe("n/a");
    expect(renderMarkdown(r)).toContain("no data");
  });
  test("computes KPIs from fixtures", () => {
    const r = buildReport(full, { minutesPerEvent: 2 });
    const get = (n: string) => r.kpis.find((k) => k.name.startsWith(n))!;
    expect(get("First-pass").value).toBe(33.3); // only A of A,B,C
    expect(get("Traceability").value).toBe(33.3); // 1 of 3 R2
    expect(get("Unsafe").value).toBe(25); // 1 deny / 4 R2+R3
    expect(get("Human").value).toBe(4); // ask + approved = 2 events x 2
    expect(r.generatedFrom.auditRecords).toBe(5);
  });
  test("reference counters are separate from KPIs", () => {
    const r = buildReport(full);
    expect(r.kpis.length).toBe(6);
    expect(renderMarkdown(r)).toContain("Reference only (NOT KPIs)");
  });
  test("parseJsonl skips malformed lines", () => {
    expect(parseJsonl('{"a":1}\nbad\n').length).toBe(1);
  });
});

test("classifyPrs handles merge-commit and squash styles", () => {
  const r = classifyPrs([
    "Merge pull request #2 from o/pr/20261010-072401-fix-thing",
    "Merge pull request #1 from o/pr/20261010-072401-docs-add",
    "fix: bug (#3)",
    "feat: x (#4)",
    "fix: unmerged direct commit",
  ]);
  expect(r).toEqual({ merged: 4, fixes: 2 });
});

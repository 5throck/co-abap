// @version 1.0.0
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { evaluate } from "../hooks/sap-action-gate.ts";
import { NEEDS_APPROVAL, readEvidence, writeEvidence } from "../lib/sap-action-lib.ts";
import { buildVspEnv, parseDotenv } from "../sap-mcp-proxy.ts";
import { run as approveRun } from "../sap-approve.ts";

const REPO = join(import.meta.dir, "..", "..");
const FIX = join(REPO, "scripts", "hooks", "__fixtures__");
const PROXY = join(REPO, "scripts", "sap-mcp-proxy.ts");
const STUB = join(REPO, "scripts", "tests", "fixtures", "stub-vsp.ts");
const fx = (n: string) => JSON.parse(readFileSync(join(FIX, `${n}.json`), "utf-8"));

let root: string;
let stubLog: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "sap-proxy-"));
  mkdirSync(join(root, "config"), { recursive: true });
  cpSync(join(REPO, "config", "sap-action-policy.json"), join(root, "config", "sap-action-policy.json"));
  stubLog = join(root, "stub.log");
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

type Chunk = string | [string, number];
async function runProxy(argv: string[], chunks: Chunk[], env: Record<string, string | undefined>, cwd?: string) {
  const proc = Bun.spawn([process.execPath, PROXY, ...argv], {
    stdin: "pipe", stdout: "pipe", stderr: "pipe", env: env as Record<string, string>, cwd,
  });
  for (const c of chunks) {
    const [s, d] = typeof c === "string" ? [c, 0] : c;
    proc.stdin.write(s);
    if (d) await Bun.sleep(d);
  }
  proc.stdin.end();
  const out = await new Response(proc.stdout).text();
  const code = await proc.exited;
  return { code, msgs: out.split("\n").filter(Boolean).map((l) => JSON.parse(l)) as any[] };
}
/** One proxy session against the stub vsp (explicit command after `--`). */
const session = (chunks: Chunk[], env: Record<string, string> = {}) =>
  runProxy(["--root", root, "--", process.execPath, STUB], chunks, { ...process.env, STUB_LOG: stubLog, ...env } as any);

const rpc = (id: number | string, method: string, params?: object) => JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n";
const callMsg = (id: number, name: string, args: object) => rpc(id, "tools/call", { name, arguments: args });
const stubSeen = () => (existsSync(stubLog) ? readFileSync(stubLog, "utf-8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const forwardedCalls = () => stubSeen().filter((m) => m.method === "tools/call");
const text = (m: any) => m.result.content[0].text as string;
const auditLines = () => {
  const d = join(root, "memory", "audit");
  return readdirSync(d).filter((f) => f.endsWith(".jsonl")).flatMap((f) => readFileSync(join(d, f), "utf-8").trim().split("\n").map((l) => JSON.parse(l)));
};
const pendingId = (t: string) => t.match(/APPROVAL_REQUIRED id=([0-9a-f]{16})/)![1];
const approve = (id: string, now?: Date) => approveRun([id, "--approver", "alice"], root, now);

describe("passthrough", () => {
  test("initialize, tools/list and notifications reach vsp unchanged", async () => {
    const { msgs, code } = await session([
      rpc(1, "initialize", { protocolVersion: "2024-11-05", clientInfo: { name: "t", version: "1" }, capabilities: {} }),
      JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n",
      rpc(2, "tools/list"), rpc("abc", "ping"),
    ]);
    expect(code).toBe(0);
    expect(msgs.find((m) => m.id === 1).result.serverInfo.name).toBe("stub-vsp");
    expect(msgs.find((m) => m.id === 2).result.tools[0].name).toBe("SAP");
    expect(msgs.find((m) => m.id === "abc").result).toEqual({});
    expect(stubSeen().map((m) => m.method)).toEqual(["initialize", "notifications/initialized", "tools/list", "ping"]);
  });

  test("partial lines and large payloads survive", async () => {
    const big = "x".repeat(2_000_000);
    const line = callMsg(7, "GetSource", { object_url: "/sap/bc/adt/oo/classes/zcl_a", pad: big });
    const mid = Math.floor(line.length / 2);
    const { msgs } = await session([[line.slice(0, mid), 50], line.slice(mid)]);
    expect(msgs).toHaveLength(1);
    expect(msgs[0].id).toBe(7);
    expect(text(msgs[0]).length).toBeGreaterThan(2_000_000);
  });
});

describe("environment and location independence", () => {
  test("dotenv parser", () => {
    expect(parseDotenv("# c\nA=1\nexport B='x y'\nC=\"q\" \nD=v # note\n=bad\n")).toEqual({ A: "1", B: "x y", C: "q", D: "v" });
  });
  test("buildVspEnv precedence: non-empty env > .env > defaults", () => {
    writeFileSync(join(root, ".env"), "SAP_URL=https://dot\nSAP_USER=fromdot\nSAP_MODE=focused\n");
    const e = buildVspEnv(root, { SAP_USER: "fromenv", SAP_URL: "", HARNESS_PROFILE: "manual" });
    expect(e.SAP_USER).toBe("fromenv");
    expect(e.SAP_URL).toBe("https://dot");
    expect(e.SAP_MODE).toBe("focused");
    expect(e.SAP_FEATURE_UI5).toBe("off");
    expect(e.SAP_ALLOWED_PACKAGES).toContain("$TMP");
    expect(e.HARNESS_PROFILE).toBeUndefined();
  });
  test("started from another cwd with an empty env: finds <root>/vsp, loads .env, applies safe defaults, vsp cwd = root", async () => {
    writeFileSync(join(root, ".env"), "SAP_URL=https://dummy.example\nSAP_USER=u\n");
    writeFileSync(join(root, "vsp"), `#!/bin/sh\nexec "${process.execPath}" "${STUB}"\n`);
    chmodSync(join(root, "vsp"), 0o755);
    const other = mkdtempSync(join(tmpdir(), "sap-other-"));
    try {
      const { msgs } = await runProxy(["--root", root], [rpc(1, "initialize", { clientInfo: { name: "t" } })], { PATH: "/usr/bin:/bin" }, other);
      const se = msgs[0].result.stubEnv;
      expect(se.cwd).toBe(root.replace(/^\/private/, ""));
      expect(se.SAP_URL).toBe("https://dummy.example");
      expect(se.SAP_USER).toBe("u");
      expect(se.SAP_MODE).toBe("hyperfocused");
      expect(se.SAP_FEATURE_UI5).toBe("off");
      expect(se.SAP_ALLOWED_PACKAGES).toBe("Z*,$TMP,$ZADT_VSP,$VSP_ADT");
    } finally { rmSync(other, { recursive: true, force: true }); }
  });
});

describe("decisions match the hook gate (all fixtures)", () => {
  test("replay", async () => {
    const files = readdirSync(FIX).filter((f) => f.endsWith(".json"));
    const chunks: string[] = [];
    const expected: Record<number, string> = {};
    files.forEach((f, i) => {
      const input = fx(f.replace(/\.json$/, ""));
      const g = evaluate(input, root);
      expected[i + 1] = g.decision === "allow" ? "allow" : g.decision === "deny" && g.reason !== NEEDS_APPROVAL ? "deny" : "approval";
      chunks.push(callMsg(i + 1, input.tool_name.replace("mcp__abap__", ""), input.tool_input));
    });
    const { msgs } = await session(chunks);
    expect(msgs).toHaveLength(files.length);
    let allows = 0;
    for (const m of msgs) {
      const kind = expected[m.id];
      const t = text(m);
      if (kind === "allow") { allows++; expect(t.startsWith("STUB_CALLED")).toBe(true); expect(m.result.isError).toBeUndefined(); }
      else if (kind === "deny") { expect(m.result.isError).toBe(true); expect(t).toContain("DENIED"); }
      else { expect(m.result.isError).toBe(true); expect(t).toContain("APPROVAL_REQUIRED id="); expect(t).toContain("bun scripts/sap-approve.ts"); }
    }
    expect(forwardedCalls()).toHaveLength(allows);
    expect(allows).toBeGreaterThan(0);
  });

  test("deny text carries the gate reason and a hash-only audit line", async () => {
    const f = fx("r2-write-bad-package");
    const { msgs } = await session([callMsg(1, f.tool_name.replace("mcp__abap__", ""), f.tool_input)]);
    expect(text(msgs[0])).toContain("outside the allowlist");
    const a = auditLines().at(-1);
    expect(a.decision).toBe("deny"); expect(a.profile).toBe("proxy"); expect(JSON.stringify(a)).not.toContain("CLASS zcl");
  });
});

describe("approvals", () => {
  const edit = (src = "CLASS zcl_test.") => ({ action: "edit", target: "CLAS ZCL_TEST", params: { source: src, package: "$TMP" } });

  test("ask -> approve -> forwarded once, then approval needed again", async () => {
    const r1 = await session([callMsg(1, "SAP", edit())]);
    const id = pendingId(text(r1.msgs[0]));
    expect(forwardedCalls()).toHaveLength(0);
    const out = approve(id);
    expect(out.code).toBe(0); expect(out.out).toContain("ZCL_TEST");
    expect(existsSync(join(root, "memory/audit/approvals", `${id}.json`))).toBe(true);

    const r2 = await session([callMsg(2, "SAP", edit())]);
    expect(text(r2.msgs[0]).startsWith("STUB_CALLED")).toBe(true);
    expect(forwardedCalls()).toHaveLength(1);
    expect(existsSync(join(root, "memory/audit/approvals", `${id}.json`))).toBe(false);
    const a = auditLines().filter((l) => l.decision === "approved");
    expect(a).toHaveLength(1); expect(a[0].approver).toBe("alice");
    expect(Object.keys(readEvidence(root))).toContain("CLAS ZCL_TEST");

    const r3 = await session([callMsg(3, "SAP", edit())]);
    expect(text(r3.msgs[0])).toContain("APPROVAL_REQUIRED");
    expect(forwardedCalls()).toHaveLength(1);
  });

  test("approval is bound to the exact input", async () => {
    const r1 = await session([callMsg(1, "SAP", edit("A"))]);
    approve(pendingId(text(r1.msgs[0])));
    const r2 = await session([callMsg(2, "SAP", edit("B"))]);
    expect(text(r2.msgs[0])).toContain("APPROVAL_REQUIRED");
    expect(pendingId(text(r2.msgs[0]))).not.toBe(pendingId(text(r1.msgs[0])));
    expect(forwardedCalls()).toHaveLength(0);
    // key order does not matter (normalized input)
    const reordered = { params: { package: "$TMP", source: "A" }, target: "CLAS ZCL_TEST", action: "edit" };
    const r3 = await session([callMsg(3, "SAP", reordered)]);
    expect(text(r3.msgs[0]).startsWith("STUB_CALLED")).toBe(true);
  });

  test("expired approval is refused; expired pending cannot be approved", async () => {
    const r1 = await session([callMsg(1, "SAP", edit())]);
    const id = pendingId(text(r1.msgs[0]));
    expect(approve(id, new Date(Date.now() + 3600e3)).code).toBe(1);
    expect(approve(id, new Date(Date.now() - 3600e3)).code).toBe(0); // granted in the past => already expired
    const r2 = await session([callMsg(2, "SAP", edit())]);
    expect(text(r2.msgs[0])).toContain("APPROVAL_REQUIRED");
    expect(forwardedCalls()).toHaveLength(0);
  });

  test("a forged approval file for another input is not honoured", async () => {
    const r1 = await session([callMsg(1, "SAP", edit("A"))]);
    const id = pendingId(text(r1.msgs[0]));
    approve(id);
    const f = join(root, "memory/audit/approvals", `${id}.json`);
    const a = JSON.parse(readFileSync(f, "utf-8")); a.inputHash = "0".repeat(64);
    writeFileSync(f, JSON.stringify(a));
    const r2 = await session([callMsg(2, "SAP", edit("A"))]);
    expect(text(r2.msgs[0])).toContain("APPROVAL_REQUIRED");
    expect(forwardedCalls()).toHaveLength(0);
  });

  test("approve CLI: list, deny, unknown id", async () => {
    expect(approveRun(["--list"], root).out).toContain("no pending");
    const r1 = await session([callMsg(1, "SAP", edit())]);
    const id = pendingId(text(r1.msgs[0]));
    expect(approveRun(["--list"], root).out).toContain(id);
    expect(approveRun([id, "--deny"], root).code).toBe(0);
    expect(approve(id).code).toBe(1);
    expect(approve("deadbeefdeadbeef").code).toBe(1);
    expect(approve("../../etc/passwd").code).toBe(1);
  });

  const OBJ = "/sap/bc/adt/oo/classes/zcl_foo";
  test("R3 release: needs passed evidence first, then approval, single use", async () => {
    const rel = fx("r3-release");
    const send = (id: number) => callMsg(id, "ReleaseTransport", rel.tool_input);
    const r1 = await session([send(1)]);
    expect(text(r1.msgs[0])).toContain("DENIED");
    expect(text(r1.msgs[0])).toContain("lack passed QA evidence");
    expect(existsSync(join(root, "memory/audit/pending"))).toBe(false);

    writeEvidence(root, { [OBJ]: { chain: {}, status: "passed" } });
    const r2 = await session([send(2)]);
    const id = pendingId(text(r2.msgs[0]));
    approve(id);
    const r3 = await session([send(3)]);
    expect(text(r3.msgs[0]).startsWith("STUB_CALLED")).toBe(true);
    const r4 = await session([send(4)]);
    expect(text(r4.msgs[0])).toContain("APPROVAL_REQUIRED");
    expect(forwardedCalls()).toHaveLength(1);
  });

  test("HARNESS_PROFILE=manual is ignored by the proxy", async () => {
    writeEvidence(root, { [OBJ]: { chain: {}, status: "passed" } });
    const rel = fx("r3-release");
    const r1 = await session([callMsg(1, "ReleaseTransport", rel.tool_input)], { HARNESS_PROFILE: "manual" });
    expect(text(r1.msgs[0])).toContain("APPROVAL_REQUIRED");
  });
});

describe("evidence, fail-safe", () => {
  test("forwarded QA call records evidence and a proxy-profile audit line", async () => {
    const obj = "/sap/bc/adt/oo/classes/zcl_foo";
    const { msgs } = await session([callMsg(1, "SyntaxCheck", { object_url: obj })]);
    expect(text(msgs[0]).startsWith("STUB_CALLED")).toBe(true);
    expect(readEvidence(root)[obj].chain.SyntaxCheck.result).toBe("pass");
    const a = auditLines().at(-1);
    expect(a.tool).toBe("SyntaxCheck"); expect(a.profile).toBe("proxy"); expect(a.decision).toBe("allow");
  });

  test("missing policy never allows a call", async () => {
    rmSync(join(root, "config", "sap-action-policy.json"));
    const { msgs } = await session([callMsg(1, "GetSource", { object_url: "/x" }), callMsg(2, "SAP", { action: "read", target: "CLAS ZA" })]);
    for (const m of msgs) { expect(m.result.isError).toBe(true); expect(text(m)).toContain("failing safe"); }
    expect(forwardedCalls()).toHaveLength(0);
  });

  test("tools/call without a name is not forwarded", async () => {
    const { msgs } = await session([rpc(1, "tools/call", {})]);
    expect(msgs[0].result.isError).toBe(true);
    expect(forwardedCalls()).toHaveLength(0);
  });
});

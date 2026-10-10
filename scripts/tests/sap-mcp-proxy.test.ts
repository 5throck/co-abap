// @version 2.1.0
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { evaluate } from "../hooks/sap-action-gate.ts";
import {
  NEEDS_APPROVAL, approvalsDir, createGrantRequest, readEvidence, revokeGrant, signGrant, writeEvidence,
} from "../lib/sap-action-lib.ts";
import { buildVspEnv, checkClientMessage, effectiveMaxClass, makeRedactor, parseArgs, parseDotenv, preloadRefusal, resolveDispatch, vspRefusal } from "../sap-mcp-proxy.ts";
import { verifyIntegrity } from "../lib/sap-action-lib.ts";
import { osUser, run as approveRun } from "../sap-approve.ts";
import { secureHome } from "./fixtures/sap-secure-home.ts";

const REPO = join(import.meta.dir, "..", "..");
const FIX = join(REPO, "scripts", "hooks", "__fixtures__");
const PROXY = join(REPO, "scripts", "sap-mcp-proxy.ts");
const STUB = join(REPO, "scripts", "tests", "fixtures", "stub-vsp.ts");
const fx = (n: string) => JSON.parse(readFileSync(join(FIX, `${n}.json`), "utf-8"));

let root: string;
let stubLog: string;
let home: ReturnType<typeof secureHome>;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "sap-proxy-"));
  mkdirSync(join(root, "config"), { recursive: true });
  cpSync(join(REPO, "config", "sap-action-policy.json"), join(root, "config", "sap-action-policy.json"));
  stubLog = join(root, "stub.log");
  home = secureHome(root, { sign: true });
});
afterEach(() => { home.restore(); rmSync(root, { recursive: true, force: true }); });

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
const approve = (id: string, now?: Date) => approveRun([id], root, now, () => id.slice(0, 6));
const init = (name: string) => rpc(0, "initialize", { protocolVersion: "2024-11-05", clientInfo: { name, version: "1" }, capabilities: {} });
const byId = (msgs: any[], id: number) => text(msgs.find((m) => m.id === id));

describe("passthrough", () => {
  test("initialize, tools/list and notifications reach vsp", async () => {
    const { msgs, code } = await session([
      rpc(1, "initialize", { protocolVersion: "2024-11-05", clientInfo: { name: "t", version: "1" }, capabilities: {} }),
      JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n",
      rpc(2, "tools/list"), rpc("abc", "ping"),
    ]);
    expect(code).toBe(0);
    expect(msgs.find((m) => m.id === 1).result.serverInfo.name).toBe("stub-vsp");
    expect(msgs.find((m) => m.id === 2).result.tools[0].name).toBe("SAP");
    expect(msgs.find((m) => m.id === "abc").result).toEqual({});
    expect(stubSeen().map((m) => m.method).filter((m) => !m.startsWith("__"))).toEqual(["initialize", "notifications/initialized", "tools/list", "ping"]);
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
  test("buildVspEnv: env > .env for ordinary keys; safety keys can only narrow", () => {
    writeFileSync(join(root, ".env"), "SAP_URL=https://dot\nSAP_USER=fromdot\nSAP_MODE=focused\nSAP_FEATURE_UI5=on\nSAP_FEATURE_DEBUG=on\nSAP_ALLOWED_PACKAGES=$TMP,SAPBC,*\nHARNESS_PROFILE=manual\n");
    const e = buildVspEnv(root, { SAP_USER: "fromenv", SAP_URL: "", HARNESS_PROFILE: "manual" });
    expect(e.SAP_USER).toBe("fromenv");
    expect(e.SAP_URL).toBe("https://dot");
    expect(e.SAP_MODE).toBe("hyperfocused");
    expect(e.SAP_FEATURE_UI5).toBe("off");
    expect(e.SAP_FEATURE_DEBUG).toBe("off");
    expect(e.SAP_ALLOWED_PACKAGES).toBe("$TMP");
    expect(e.HARNESS_PROFILE).toBeUndefined();
    rmSync(join(root, ".env"));
    expect(buildVspEnv(root, { SAP_ALLOWED_PACKAGES: "ZFOO*" }).SAP_ALLOWED_PACKAGES).toBe("ZFOO*");
    expect(buildVspEnv(root, { SAP_ALLOWED_PACKAGES: "SAPBC" }).SAP_ALLOWED_PACKAGES).toBe("Z*,$TMP,$ZADT_VSP,$VSP_ADT");
  });
  test("SAP_FEATURE_* can be turned on only when the policy allows it", () => {
    const pol = JSON.parse(readFileSync(join(root, "config", "sap-action-policy.json"), "utf-8"));
    expect(buildVspEnv(root, { SAP_FEATURE_RAP: "on" }, pol).SAP_FEATURE_RAP).toBe("off");
    pol.vspFeatures.allowOn = ["SAP_FEATURE_RAP"];
    expect(buildVspEnv(root, { SAP_FEATURE_RAP: "on" }, pol).SAP_FEATURE_RAP).toBe("on");
    expect(buildVspEnv(root, {}, pol).SAP_FEATURE_RAP).toBe("off");
  });
  test("refuses the repo's own ./vsp under CI or NODE_ENV=test", () => {
    expect(vspRefusal(join(REPO, "vsp"), REPO, { CI: "1" })).toContain("refusing");
    expect(vspRefusal(join(REPO, "vsp"), REPO, { NODE_ENV: "test" })).toContain("refusing");
    expect(vspRefusal(join(REPO, "vsp"), REPO, {})).toBeNull();
    expect(vspRefusal(join(root, "vsp"), REPO, { CI: "1" })).toBeNull();
  });
  test("stderr redactor hides credentials", () => {
    const r = makeRedactor({ SAP_PASSWORD: "hunter22", SAP_USER: "bob" });
    const out = r("login bob/hunter22 failed; password=abc123 Authorization: Basic Ym9iOmh1bnRlcjIy");
    expect(out).not.toContain("hunter22"); expect(out).not.toContain("abc123"); expect(out).not.toContain("Ym9iOmh1");
    expect(out).toContain("bob");
  });
  test("started from another cwd with an empty env: finds <root>/vsp, loads .env, applies safe defaults, vsp cwd = root", async () => {
    writeFileSync(join(root, ".env"), "SAP_URL=https://dummy.example\nSAP_USER=u\n");
    writeFileSync(join(root, "vsp"), `#!/bin/sh\nexec "${process.execPath}" "${STUB}"\n`);
    chmodSync(join(root, "vsp"), 0o755);
    const other = mkdtempSync(join(tmpdir(), "sap-other-"));
    try {
      const { msgs } = await runProxy(["--root", root], [rpc(1, "initialize", { clientInfo: { name: "t" } })], { PATH: "/usr/bin:/bin", HOME: home.home }, other);
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
    expect(a.mac).toMatch(/^[0-9a-f]{64}$/);
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
    expect(existsSync(join(approvalsDir(root), `${id}.json`))).toBe(true);

    const r2 = await session([callMsg(2, "SAP", edit())]);
    expect(text(r2.msgs[0]).startsWith("STUB_CALLED")).toBe(true);
    expect(forwardedCalls()).toHaveLength(1);
    expect(existsSync(join(approvalsDir(root), `${id}.json`))).toBe(false);
    const a = auditLines().filter((l) => l.decision === "approved");
    expect(a).toHaveLength(1); expect(a[0].approver).toBe(osUser());
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
    const reordered = { params: { package: "$TMP", source: "A" }, target: "CLAS ZCL_TEST", action: "edit" };
    const r3 = await session([callMsg(3, "SAP", reordered)]);
    expect(text(r3.msgs[0]).startsWith("STUB_CALLED")).toBe(true);
  });

  test("approval is bound to the client that requested it", async () => {
    const r1 = await session([init("claude-code"), callMsg(1, "SAP", edit())]);
    approve(pendingId(byId(r1.msgs, 1)));
    const other = await session([init("gemini-cli"), callMsg(2, "SAP", edit())]);
    expect(byId(other.msgs, 2)).toContain("APPROVAL_REQUIRED");
    const same = await session([init("claude-code"), callMsg(3, "SAP", edit())]);
    expect(byId(same.msgs, 3).startsWith("STUB_CALLED")).toBe(true);
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

  test("a tampered approval file is not honoured (MAC)", async () => {
    const r1 = await session([callMsg(1, "SAP", edit("A"))]);
    const id = pendingId(text(r1.msgs[0]));
    approve(id);
    const f = join(approvalsDir(root), `${id}.json`);
    const a = JSON.parse(readFileSync(f, "utf-8")); a.expires = new Date(Date.now() + 864e5).toISOString();
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

  test("no key: requests are denied with init instructions", async () => {
    rmSync(join(home.home, ".config"), { recursive: true, force: true });
    const r = await session([callMsg(1, "SAP", edit())]);
    expect(text(r.msgs[0])).toContain("DENIED");
    expect(text(r.msgs[0])).toContain("sap-integrity.ts");
    expect(forwardedCalls()).toHaveLength(0);
  });

  const OBJ = "/sap/bc/adt/oo/classes/zcl_foo";
  test("R3 release: needs passed evidence first, then approval, single use", async () => {
    const rel = fx("r3-release");
    const send = (id: number) => callMsg(id, "ReleaseTransport", rel.tool_input);
    const r1 = await session([send(1)]);
    expect(text(r1.msgs[0])).toContain("DENIED");
    expect(text(r1.msgs[0])).toContain("lack passed QA evidence");

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

  test("hand-written 'passed' evidence (no MAC) does not unlock a release", async () => {
    mkdirSync(join(root, "memory", "audit"), { recursive: true });
    writeFileSync(join(root, "memory", "audit", "sap-evidence.json"), JSON.stringify({ [OBJ]: { chain: {}, status: "passed" } }));
    const r = await session([callMsg(1, "ReleaseTransport", fx("r3-release").tool_input)]);
    expect(text(r.msgs[0])).toContain("lack passed QA evidence");
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
    for (const m of msgs) { expect(m.result.isError).toBe(true); expect(text(m)).toContain("DENIED"); }
    expect(forwardedCalls()).toHaveLength(0);
  });

  test("tools/call without a name is not forwarded", async () => {
    const { msgs } = await session([rpc(1, "tools/call", {})]);
    expect(msgs[0].error.code).toBe(-32602);
    expect(forwardedCalls()).toHaveLength(0);
  });
});

describe("integrity manifest", () => {
  test("policy edit after signing: R1+ denied, hardcoded reads still allowed", async () => {
    const f = join(root, "config", "sap-action-policy.json");
    const pol = JSON.parse(readFileSync(f, "utf-8"));
    pol.hyperfocused.actions.delete = "R0"; // attacker reclassifies delete
    writeFileSync(f, JSON.stringify(pol));
    const { msgs } = await session([
      callMsg(1, "SAP", { action: "delete", target: "CLAS ZCL_A" }),
      callMsg(2, "SAP", { action: "read", target: "CLAS ZCL_A" }),
      callMsg(3, "SAP", { action: "test", target: "CLAS ZCL_A" }),
    ]);
    expect(byId(msgs, 1)).toContain("integrity check failed");
    expect(byId(msgs, 2).startsWith("STUB_CALLED")).toBe(true);
    expect(byId(msgs, 3)).toContain("integrity check failed");
    expect(forwardedCalls()).toHaveLength(1);
  });
});

describe("max class", () => {
  test("stricter of --max-class and SAP_PROXY_MAX_CLASS wins; env cannot raise", () => {
    expect(effectiveMaxClass(undefined, undefined)).toBe("R3");
    expect(effectiveMaxClass("R3", "R0")).toBe("R0");
    expect(effectiveMaxClass("R0", "R3")).toBe("R0");
    expect(effectiveMaxClass("R1", "R2")).toBe("R1");
    expect(effectiveMaxClass(undefined, "bogus")).toBe("R0");
  });
  test("env SAP_PROXY_MAX_CLASS=R0 denies R1 and R2 (no approval request)", async () => {
    const { msgs } = await session([
      callMsg(1, "SAP", { action: "read", target: "CLAS ZCL_A" }),
      callMsg(2, "SAP", { action: "test", target: "CLAS ZCL_A" }),
      callMsg(3, "SAP", { action: "edit", target: "CLAS ZCL_A", params: { source: "x", package: "$TMP" } }),
    ], { SAP_PROXY_MAX_CLASS: "R0" });
    expect(byId(msgs, 1).startsWith("STUB_CALLED")).toBe(true);
    expect(byId(msgs, 2)).toContain("exceeds this proxy's maximum class R0");
    expect(byId(msgs, 3)).toContain("exceeds");
    expect(byId(msgs, 3)).not.toContain("APPROVAL_REQUIRED");
  });
  test("--max-class R1 with env R3 stays R1", async () => {
    const { msgs } = await runProxy(["--root", root, "--max-class", "R1", "--", process.execPath, STUB],
      [callMsg(1, "SAP", { action: "test", target: "CLAS ZCL_A" }), callMsg(2, "SAP", { action: "edit", target: "CLAS ZCL_A", params: { source: "x", package: "$TMP" } })],
      { ...process.env, STUB_LOG: stubLog, SAP_PROXY_MAX_CLASS: "R3" } as any);
    expect(byId(msgs, 1).startsWith("STUB_CALLED")).toBe(true);
    expect(byId(msgs, 2)).toContain("maximum class R1");
  });
});

describe("strict JSON-RPC", () => {
  test("validator", () => {
    expect(checkClientMessage("not json").kind).toBe("reject");
    expect(checkClientMessage("[]").kind).toBe("reject");
    expect(checkClientMessage(JSON.stringify({ jsonrpc: "2.0", id: 1, Method: "tools/call", method: "ping" })).kind).toBe("reject");
    expect(checkClientMessage(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "resources/read", params: {} })).kind).toBe("reject");
    expect(checkClientMessage(JSON.stringify({ jsonrpc: "2.0", method: "resources/read" })).kind).toBe("drop");
    expect(checkClientMessage(JSON.stringify({ jsonrpc: "2.0", method: "tools/call", params: { name: "SAP", arguments: {} } })).kind).toBe("drop");
    const call = (params: object) => checkClientMessage(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params }));
    expect(call({ name: "SAP", Arguments: {} }).kind).toBe("reject");
    expect(call({ name: "SAP", arguments: { action: "read", Action: "delete" } }).kind).toBe("reject");
    expect(call({ name: "SAP", arguments: { ACTION: "delete" } }).kind).toBe("reject");
    expect(call({ name: "SAP", arguments: { action: "read", params: { action: "delete" } } }).kind).toBe("reject");
    expect(call({ name: "SAP", arguments: { action: "read", params: JSON.stringify({ target: "X" }) } }).kind).toBe("reject");
    expect(call({ name: "SAP", arguments: { action: "read", target: "X" } }).kind).toBe("forward");
    expect(checkClientMessage(JSON.stringify({ jsonrpc: "2.0", id: 9, result: {} })).kind).toBe("forward");
  });
  test("rejected messages never reach vsp; duplicate keys collapse before forwarding", async () => {
    const { msgs } = await session([
      "garbage line\n",
      JSON.stringify([{ jsonrpc: "2.0", id: 1, method: "ping" }]) + "\n",
      rpc(2, "resources/list", {}),
      JSON.stringify({ jsonrpc: "2.0", id: 3, Method: "tools/call", method: "ping" }) + "\n",
      '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"SAP","arguments":{"action":"delete","action":"read","target":"CLAS ZCL_A"}}}\n',
    ]);
    expect(msgs.filter((m) => m.error).length).toBe(4);
    expect(msgs.find((m) => m.id === 2).error.code).toBe(-32601);
    const fwd = forwardedCalls();
    expect(fwd).toHaveLength(1);
    expect(fwd[0].params.arguments.action).toBe("read");
    expect(stubSeen().filter((m) => !m.method?.startsWith("__")).map((m) => m.method)).toEqual(["tools/call"]);
  });
});

describe("dispatch grants", () => {
  const rows = [
    { row: "1", packages: [], objects: ["CLAS ZCL_*"], actions: ["read", "search"], maxClass: "R0" as const },
    { row: "2", packages: ["$TMP"], objects: ["CLAS ZCL_A"], actions: ["edit", "test"], maxClass: "R2" as const },
  ];
  const grant = () => {
    const g = createGrantRequest({ runId: "run-x", rows, expiresAt: new Date(Date.now() + 3600e3).toISOString() }, root);
    signGrant(root, "run-x", "human", new Date());
    return g.grantId;
  };
  const edit = { action: "edit", target: "CLAS ZCL_A", params: { source: "x", package: "$TMP" } };
  test("in-scope calls allowed without per-call approval (multi-use); out of scope denied; audit carries grant", async () => {
    const gid = grant();
    const { msgs } = await session([
      callMsg(1, "SAP", edit), callMsg(2, "SAP", edit),
      callMsg(3, "SAP", { action: "edit", target: "CLAS YCL_A", params: { source: "x", package: "ZOTHER" } }),
      callMsg(4, "SAP", { action: "delete", target: "CLAS ZCL_A" }),
      callMsg(5, "SAP", { action: "read", target: "CLAS ZCL_A" }),
    ], { SAP_DISPATCH_GRANT: gid, SAP_DISPATCH_ROW: "2" });
    expect(byId(msgs, 1).startsWith("STUB_CALLED")).toBe(true);
    expect(byId(msgs, 2).startsWith("STUB_CALLED")).toBe(true);
    for (const id of [3, 4, 5]) { expect(byId(msgs, id)).toContain("DENIED"); expect(byId(msgs, id)).not.toContain("APPROVAL_REQUIRED"); }
    const a = auditLines().filter((l) => l.grantId === gid);
    expect(a.length).toBeGreaterThanOrEqual(5); expect(a.every((l) => l.grantRow === "2")).toBe(true);
  });
  test("read row with SAP_PROXY_MAX_CLASS=R0; revoked/unknown/misconfigured grant denies", async () => {
    const gid = grant();
    const r1 = await session([callMsg(1, "SAP", { action: "read", target: "CLAS ZCL_A" }), callMsg(2, "SAP", edit)],
      { SAP_DISPATCH_GRANT: gid, SAP_DISPATCH_ROW: "1", SAP_PROXY_MAX_CLASS: "R0" });
    expect(byId(r1.msgs, 1).startsWith("STUB_CALLED")).toBe(true);
    expect(byId(r1.msgs, 2)).toContain("DENIED");
    revokeGrant(gid, root);
    const r2 = await session([callMsg(3, "SAP", { action: "read", target: "CLAS ZCL_A" })], { SAP_DISPATCH_GRANT: gid, SAP_DISPATCH_ROW: "1" });
    expect(text(r2.msgs[0])).toContain("revoked");
    const r3 = await session([callMsg(4, "SAP", { action: "read", target: "X" })], { SAP_DISPATCH_GRANT: "0123456789abcdef", SAP_DISPATCH_ROW: "1" });
    expect(text(r3.msgs[0])).toContain("DENIED");
    const r4 = await session([callMsg(5, "SAP", { action: "read", target: "X" })], { SAP_DISPATCH_GRANT: gid });
    expect(text(r4.msgs[0])).toContain("misconfigured");
  });
});

describe("graceful shutdown", () => {
  test("SIGTERM: in-flight call finishes and is audited, new calls rejected, vsp stdin closed", async () => {
    const proc = Bun.spawn([process.execPath, PROXY, "--root", root, "--", process.execPath, STUB], {
      stdin: "pipe", stdout: "pipe", stderr: "pipe", env: { ...process.env, STUB_LOG: stubLog } as any,
    });
    proc.stdin.write(callMsg(1, "SAP", { action: "read", target: "CLAS ZCL_A", stub_delay_ms: 600 }));
    await Bun.sleep(250);
    proc.kill("SIGTERM");
    await Bun.sleep(100);
    proc.stdin.write(callMsg(2, "SAP", { action: "read", target: "CLAS ZCL_B" }));
    const t0 = Date.now();
    const out = await new Response(proc.stdout).text();
    await proc.exited;
    expect(Date.now() - t0).toBeLessThan(8000);
    const msgs = out.split("\n").filter(Boolean).map((l) => JSON.parse(l));
    expect(byId(msgs, 1).startsWith("STUB_CALLED")).toBe(true);
    expect(msgs.find((m) => m.id === 2).error.message).toContain("shutting down");
    expect(auditLines().some((l) => l.tool === "read" && l.decision === "allow")).toBe(true);
    expect(forwardedCalls()).toHaveLength(1);
    expect(stubSeen().map((m) => m.method)).toContain("__EOF__");
  });
});

describe("dispatch argv (H2)", () => {
  const a = (argv: string[]) => parseArgs(argv);
  test("argv and env are both accepted; stricter ceiling wins; child defaults to R0", () => {
    expect(resolveDispatch(a(["--max-class", "R2"]), { SAP_PROXY_MAX_CLASS: "R1" }).maxClass).toBe("R1");
    expect(resolveDispatch(a(["--max-class", "R0"]), { SAP_PROXY_MAX_CLASS: "R3" }).maxClass).toBe("R0");
    expect(resolveDispatch(a([]), {}).maxClass).toBe("R3");
    expect(resolveDispatch(a(["--dispatch-child"]), {}).maxClass).toBe("R0");
    expect(resolveDispatch(a([]), { SAP_DISPATCH_CHILD: "1" }).maxClass).toBe("R0");
    expect(resolveDispatch(a(["--dispatch-child", "--max-class", "R2", "--dispatch-mode", "write"]), {}).maxClass).toBe("R0");
    const w = resolveDispatch(a(["--dispatch-child", "--max-class", "R2", "--dispatch-mode", "write", "--dispatch-grant", "0123456789abcdef", "--dispatch-row", "2"]), {});
    expect(w.maxClass).toBe("R2"); expect(w.grant).toEqual({ id: "0123456789abcdef", row: "2" });
    expect(resolveDispatch(a(["--dispatch-grant", "0123456789abcdef"]), { SAP_DISPATCH_GRANT: "fedcba9876543210", SAP_DISPATCH_ROW: "1" }).grant?.conflict).toContain("differs");
    expect(resolveDispatch(a(["--dispatch-row", "1"]), { SAP_DISPATCH_GRANT: "0123456789abcdef", SAP_DISPATCH_ROW: "1" }).grant).toEqual({ id: "0123456789abcdef", row: "1" });
    expect(() => a(["--max-class", "R9"])).toThrow();
  });
  test("grant via argv works end-to-end; argv/env disagreement denies; write child without grant is R0", async () => {
    const g = createGrantRequest({ runId: "run-a", rows: [{ row: "1", packages: ["$TMP"], objects: ["CLAS ZCL_A"], actions: ["edit"], maxClass: "R2" }], expiresAt: new Date(Date.now() + 3600e3).toISOString() }, root);
    signGrant(root, "run-a", "human", new Date());
    const edit = { action: "edit", target: "CLAS ZCL_A", params: { source: "x", package: "$TMP" } };
    const base = ["--root", root, "--dispatch-child", "--dispatch-mode", "write", "--max-class", "R2", "--dispatch-grant", g.grantId, "--dispatch-row", "1"];
    const env = { ...process.env, STUB_LOG: stubLog } as any;
    delete env.SAP_DISPATCH_GRANT; delete env.SAP_DISPATCH_ROW; delete env.SAP_PROXY_MAX_CLASS;
    const ok = await runProxy([...base, "--", process.execPath, STUB], [callMsg(1, "SAP", edit)], env);
    expect(byId(ok.msgs, 1).startsWith("STUB_CALLED")).toBe(true);
    const bad = await runProxy([...base, "--", process.execPath, STUB], [callMsg(2, "SAP", edit)], { ...env, SAP_DISPATCH_ROW: "9" });
    expect(byId(bad.msgs, 2)).toContain("misconfigured");
    const noGrant = await runProxy(["--root", root, "--dispatch-child", "--dispatch-mode", "write", "--max-class", "R2", "--", process.execPath, STUB], [callMsg(3, "SAP", edit)], env);
    expect(byId(noGrant.msgs, 3)).toContain("maximum class R0");
  });
});

describe("bun config integrity (H3)", () => {
  test("bunfig.toml/package.json are covered; unsigned preload refuses to start", async () => {
    writeFileSync(join(root, "package.json"), "{}");
    expect(verifyIntegrity(root, REPO).reason).toContain("package.json");
    rmSync(join(root, "package.json"));
    writeFileSync(join(root, "extra-preload.ts"), "export {};\n");
    writeFileSync(join(root, "bunfig.toml"), 'preload = ["./extra-preload.ts"]\n');
    expect(verifyIntegrity(root, REPO).ok).toBe(false);
    expect(preloadRefusal(root, root, REPO, false)).toContain("refusing");
    const other = mkdtempSync(join(tmpdir(), "sap-cwd-"));
    try {
      writeFileSync(join(other, "bunfig.toml"), 'preload = "./x.ts"\n');
      expect(preloadRefusal(other, root, REPO, true)).toContain("not covered");
    } finally { rmSync(other, { recursive: true, force: true }); }
    const r = await session([callMsg(1, "SAP", { action: "read", target: "CLAS ZCL_A" })]);
    expect(r.code).toBe(126);
    expect(forwardedCalls()).toHaveLength(0);
  });
});

/**
 * @version 1.0.0
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const VALIDATOR = join(import.meta.dir, "..", "validate-docs-links.ts");

function runValidator(content: string): { exitCode: number; output: string } {
  const fixtureDir = mkdtempSync(join(tmpdir(), "validate-docs-links-"));
  try {
    writeFileSync(join(fixtureDir, "fixture.md"), content);
    const result = Bun.spawnSync({
      cmd: ["bun", VALIDATOR, `--dir=${fixtureDir}`],
      stdout: "pipe",
      stderr: "pipe",
    });
    return {
      exitCode: result.exitCode,
      output: `${new TextDecoder().decode(result.stdout)}${new TextDecoder().decode(result.stderr)}`,
    };
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
}

describe("validate-docs-links", () => {
  test("ignores the ${entry.file} placeholder in a fenced code sample", () => {
    const result = runValidator([
      "```ts",
      "const link = `[${entry.date}](${entry.file})`;",
      "```",
      "",
    ].join("\n"));

    expect(result.exitCode).toBe(0);
    expect(result.output).not.toContain("${entry.file}");
  });

  test("still detects a broken relative link in prose", () => {
    const result = runValidator("[broken prose link](missing/path.md)\n");

    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("broken link → missing/path.md");
  });
});

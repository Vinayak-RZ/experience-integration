import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("upstream OpenAPI drift check", () => {
  it("passes against pinned snapshots", () => {
    const result = spawnSync(
      process.execPath,
      [join(root, "scripts/check-upstream-contracts.mjs")],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /OK/);
  });
});

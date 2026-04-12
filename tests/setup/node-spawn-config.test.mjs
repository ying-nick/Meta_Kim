import { describe, test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import { buildNodeScriptSpawn } from "../../scripts/node-spawn-config.mjs";

describe("buildNodeScriptSpawn()", () => {
  test("disables shell for node exec paths that contain spaces", () => {
    const spawnConfig = buildNodeScriptSpawn(
      "C:\\Program Files\\nodejs\\node.exe",
      "C:\\repo\\Meta_Kim",
      "scripts/install-global-skills-all-runtimes.mjs",
      ["--targets", "claude,codex"],
      ["--lang", "zh-CN"],
    );

    assert.equal(spawnConfig.command, "C:\\Program Files\\nodejs\\node.exe");
    assert.deepEqual(spawnConfig.args, [
      "C:\\repo\\Meta_Kim\\scripts\\install-global-skills-all-runtimes.mjs",
      "--lang",
      "zh-CN",
      "--targets",
      "claude,codex",
    ]);
    assert.deepEqual(spawnConfig.options, {
      cwd: "C:\\repo\\Meta_Kim",
      stdio: "inherit",
      shell: false,
    });
  });

  test("uses the same safe spawn options on non-Windows paths", () => {
    const spawnConfig = buildNodeScriptSpawn(
      "/usr/local/bin/node",
      "/repo/Meta_Kim",
      "scripts/sync-global-meta-theory.mjs",
    );

    assert.equal(spawnConfig.command, "/usr/local/bin/node");
    assert.deepEqual(spawnConfig.args, [
      path.join("/repo/Meta_Kim", "scripts", "sync-global-meta-theory.mjs"),
    ]);
    assert.deepEqual(spawnConfig.options, {
      cwd: "/repo/Meta_Kim",
      stdio: "inherit",
      shell: false,
    });
  });
});

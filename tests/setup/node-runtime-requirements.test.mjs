import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  MIN_NODE_VERSION,
  compareSemver,
  isSupportedNodeVersion,
  parseSemver,
} from "../../scripts/node-runtime-requirements.mjs";

describe("node-runtime-requirements", () => {
  test("minimum version is pinned to the first unflagged node:sqlite release", () => {
    assert.equal(MIN_NODE_VERSION, "22.13.0");
  });

  test("parseSemver reads major minor patch", () => {
    assert.deepEqual(parseSemver("22.13.1"), {
      major: 22,
      minor: 13,
      patch: 1,
    });
  });

  test("compareSemver handles major minor patch ordering", () => {
    assert.ok(compareSemver("22.13.0", "22.13.0") === 0);
    assert.ok(compareSemver("22.13.1", "22.13.0") > 0);
    assert.ok(compareSemver("22.12.9", "22.13.0") < 0);
    assert.ok(compareSemver("23.0.0", "22.13.0") > 0);
  });

  test("isSupportedNodeVersion rejects unsupported runtimes", () => {
    assert.equal(isSupportedNodeVersion("18.20.4"), false);
    assert.equal(isSupportedNodeVersion("20.18.1"), false);
    assert.equal(isSupportedNodeVersion("22.12.0"), false);
    assert.equal(isSupportedNodeVersion("22.13.0"), true);
    assert.equal(isSupportedNodeVersion("22.19.0"), true);
    assert.equal(isSupportedNodeVersion("24.0.0"), true);
  });
});

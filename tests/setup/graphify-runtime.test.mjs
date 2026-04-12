import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  detectPython310,
  extractPipShowVersion,
  formatPythonLauncher,
  runPythonModule,
} from "../../scripts/graphify-runtime.mjs";

describe("detectPython310()", () => {
  test("detects python when version is printed to stderr", () => {
    const python = detectPython310(
      (command) => {
        if (command === "python3") {
          return {
            status: 0,
            stdout: "",
            stderr: "Python 3.11.7",
          };
        }
        return {
          status: 1,
          stdout: "",
          stderr: "",
          error: new Error("not found"),
        };
      },
      "linux",
    );

    assert.equal(python.command, "python3");
    assert.equal(python.version.major, 3);
    assert.equal(python.version.minor, 11);
  });

  test("prefers py -3 on Windows when available", () => {
    const calls = [];
    const python = detectPython310(
      (command, args) => {
        calls.push([command, args]);
        if (command === "py") {
          return {
            status: 0,
            stdout: "Python 3.12.1",
            stderr: "",
          };
        }
        return {
          status: 1,
          stdout: "",
          stderr: "",
          error: new Error("not found"),
        };
      },
      "win32",
    );

    assert.equal(python.command, "py");
    assert.deepEqual(python.args, ["-3"]);
    assert.deepEqual(calls[0], ["py", ["-3", "--version"]]);
  });
});

describe("runPythonModule()", () => {
  test("reuses the same interpreter for pip installs", () => {
    const calls = [];
    runPythonModule(
      { command: "py", args: ["-3"] },
      ["-m", "pip", "install", "graphifyy"],
      (command, args, options) => {
        calls.push({ command, args, options });
        return { status: 0, stdout: "", stderr: "" };
      },
    );

    assert.deepEqual(calls[0], {
      command: "py",
      args: ["-3", "-m", "pip", "install", "graphifyy"],
      options: {
        encoding: "utf8",
        shell: false,
      },
    });
  });
});

describe("graphify helpers", () => {
  test("extractPipShowVersion reads version from pip show output", () => {
    assert.equal(
      extractPipShowVersion("Name: graphifyy\nVersion: 1.2.3\nSummary: test"),
      "1.2.3",
    );
  });

  test("formatPythonLauncher renders launcher arguments", () => {
    assert.equal(formatPythonLauncher({ command: "py", args: ["-3"] }), "py -3");
  });
});

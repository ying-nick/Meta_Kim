import { spawnSync } from "node:child_process";

export function readProcessText(result) {
  const stdout =
    typeof result?.stdout === "string"
      ? result.stdout
      : result?.stdout?.toString?.("utf8") ?? "";
  const stderr =
    typeof result?.stderr === "string"
      ? result.stderr
      : result?.stderr?.toString?.("utf8") ?? "";
  return [stdout, stderr].filter(Boolean).join("\n").trim();
}

export function parsePythonVersion(text) {
  const match = text.match(/Python\s+(\d+)\.(\d+)(?:\.(\d+))?/i);
  if (!match) {
    return null;
  }
  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3] ?? "0", 10),
    raw: match[0],
  };
}

export function pythonCandidates(platform = process.platform) {
  if (platform === "win32") {
    return [
      { command: "py", args: ["-3"] },
      { command: "python", args: [] },
      { command: "python3", args: [] },
    ];
  }
  return [
    { command: "python3", args: [] },
    { command: "python", args: [] },
  ];
}

export function formatPythonLauncher(python) {
  return [python.command, ...python.args].join(" ");
}

export function detectPython310(
  spawnFn = spawnSync,
  platform = process.platform,
) {
  for (const candidate of pythonCandidates(platform)) {
    let result;
    try {
      result = spawnFn(candidate.command, [...candidate.args, "--version"], {
        encoding: "utf8",
        shell: false,
      });
    } catch {
      continue;
    }

    if (result?.error || result?.status !== 0) {
      continue;
    }

    const versionText = readProcessText(result);
    const parsed = parsePythonVersion(versionText);
    if (
      parsed &&
      (parsed.major > 3 || (parsed.major === 3 && parsed.minor >= 10))
    ) {
      return {
        ...candidate,
        version: parsed,
        versionText,
      };
    }
  }

  return null;
}

export function runPythonModule(
  python,
  moduleArgs,
  spawnFn = spawnSync,
  options = {},
) {
  return spawnFn(python.command, [...python.args, ...moduleArgs], {
    encoding: "utf8",
    shell: false,
    ...options,
  });
}

export function extractPipShowVersion(text) {
  const match = text.match(/Version:\s*(.+)/i);
  return match ? match[1].trim() : null;
}

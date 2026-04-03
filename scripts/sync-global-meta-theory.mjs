#!/usr/bin/env node

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const sourceDir = path.join(repoRoot, ".claude", "skills", "meta-theory");
const sourceSkillFile = path.join(sourceDir, "SKILL.md");

const checkOnly = process.argv.includes("--check");
const activateCodex = process.argv.includes("--activate-codex");
const printTargetsOnly = process.argv.includes("--print-targets");

const runtimeSpecs = {
  claude: {
    label: "Claude Code",
    envKeys: ["META_KIM_CLAUDE_HOME", "CLAUDE_HOME"],
    defaultDirName: ".claude",
    requiredMarkers: ["skills"],
    preferredMarkers: ["settings.json", "agents"],
  },
  openclaw: {
    label: "OpenClaw",
    envKeys: ["META_KIM_OPENCLAW_HOME", "OPENCLAW_HOME"],
    defaultDirName: ".openclaw",
    requiredMarkers: ["skills"],
    preferredMarkers: ["openclaw.json", "config.yaml"],
  },
  codex: {
    label: "Codex",
    envKeys: ["META_KIM_CODEX_HOME", "CODEX_HOME"],
    defaultDirName: ".codex",
    requiredMarkers: ["skills"],
    preferredMarkers: ["config.toml", "commands"],
  },
};
let runtimeHomes = {};
let allowedRoots = [];
let activeTargets = [];
let cleanupTargets = [];

function assertHomeBound(targetPath) {
  const resolved = path.resolve(targetPath);
  const isAllowed = allowedRoots.some(
    (root) => resolved === root || resolved.startsWith(`${root}${path.sep}`)
  );
  if (!isAllowed) {
    throw new Error(`Refusing to write outside the configured runtime homes: ${resolved}`);
  }
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function hasRequiredMarkers(candidateDir, spec) {
  const checks = await Promise.all(
    spec.requiredMarkers.map((marker) => pathExists(path.join(candidateDir, marker)))
  );
  return checks.every(Boolean);
}

async function countPreferredMarkers(candidateDir, spec) {
  const checks = await Promise.all(
    spec.preferredMarkers.map((marker) => pathExists(path.join(candidateDir, marker)))
  );
  return checks.filter(Boolean).length;
}

function uniquePaths(paths) {
  return [...new Set(paths.map((entry) => path.resolve(entry)))];
}

async function findNestedRuntimeHome(spec) {
  const homeDir = path.resolve(os.homedir());
  const candidates = [
    path.join(homeDir, spec.defaultDirName),
    path.join(homeDir, ".config", spec.defaultDirName.replace(/^\./, "")),
    path.join(homeDir, ".config", spec.defaultDirName),
  ];

  let bestMatch = null;

  for (const candidate of uniquePaths(candidates)) {
    if (!(await pathExists(candidate))) {
      continue;
    }
    if (!(await hasRequiredMarkers(candidate, spec))) {
      continue;
    }
    const score = await countPreferredMarkers(candidate, spec);
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { dir: candidate, score };
    }
  }

  return bestMatch?.dir ?? null;
}

async function resolveRuntimeHome(spec) {
  for (const key of spec.envKeys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim()) {
      return {
        dir: path.resolve(value.trim()),
        source: `env:${key}`,
      };
    }
  }

  const discovered = await findNestedRuntimeHome(spec);
  if (discovered) {
    return {
      dir: discovered,
      source: discovered === path.join(path.resolve(os.homedir()), spec.defaultDirName)
        ? "default"
        : "search",
    };
  }

  return {
    dir: path.join(path.resolve(os.homedir()), spec.defaultDirName),
    source: "fallback",
  };
}

async function resolveTargets() {
  runtimeHomes = {
    claude: await resolveRuntimeHome(runtimeSpecs.claude),
    openclaw: await resolveRuntimeHome(runtimeSpecs.openclaw),
    codex: await resolveRuntimeHome(runtimeSpecs.codex),
  };

  allowedRoots = Object.values(runtimeHomes).map(({ dir }) => path.resolve(dir));

  activeTargets = [
    {
      label: "Claude Code global skill",
      dir: path.join(runtimeHomes.claude.dir, "skills", "meta-theory"),
    },
    {
      label: "OpenClaw global skill",
      dir: path.join(runtimeHomes.openclaw.dir, "skills", "meta-theory"),
    },
    {
      label: activateCodex ? "Codex global skill" : "Codex standby skill",
      dir: activateCodex
        ? path.join(runtimeHomes.codex.dir, "skills", "meta-theory")
        : path.join(runtimeHomes.codex.dir, "skills", ".disabled", "meta-theory"),
    },
  ];

  cleanupTargets = [
    {
      label: "legacy OpenClaw flat skill",
      dir: path.join(runtimeHomes.openclaw.dir, "skills", "meta-theory.md"),
    },
    {
      label: activateCodex ? "Codex standby skill" : "Codex active skill",
      dir: activateCodex
        ? path.join(runtimeHomes.codex.dir, "skills", ".disabled", "meta-theory")
        : path.join(runtimeHomes.codex.dir, "skills", "meta-theory"),
    },
  ];
}

async function* walkFiles(rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(fullPath);
      continue;
    }
    if (entry.isFile()) {
      yield fullPath;
    }
  }
}

async function fingerprintDir(rootDir) {
  if (!(await pathExists(rootDir))) {
    return null;
  }

  const filePaths = [];
  for await (const filePath of walkFiles(rootDir)) {
    filePaths.push(filePath);
  }
  filePaths.sort((left, right) => left.localeCompare(right));

  const hash = createHash("sha256");
  for (const filePath of filePaths) {
    const relativePath = path.relative(rootDir, filePath).replace(/\\/g, "/");
    hash.update(relativePath);
    hash.update("\n");
    hash.update(await fs.readFile(filePath));
    hash.update("\n");
  }

  return {
    fileCount: filePaths.length,
    hash: hash.digest("hex"),
  };
}

async function copyCanonicalSkill(targetDir) {
  assertHomeBound(targetDir);
  await fs.mkdir(path.dirname(targetDir), { recursive: true });
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.cp(sourceDir, targetDir, { recursive: true, force: true });
}

async function removeIfExists(targetPath) {
  assertHomeBound(targetPath);
  if (!(await pathExists(targetPath))) {
    return false;
  }
  await fs.rm(targetPath, { recursive: true, force: true });
  return true;
}

async function runCheck() {
  const sourceFingerprint = await fingerprintDir(sourceDir);
  let failed = false;

  for (const target of activeTargets) {
    const targetFingerprint = await fingerprintDir(target.dir);
    const inSync =
      targetFingerprint !== null &&
      sourceFingerprint !== null &&
      targetFingerprint.hash === sourceFingerprint.hash &&
      targetFingerprint.fileCount === sourceFingerprint.fileCount;
    console.log(`${inSync ? "OK" : "MISSING"} ${target.label}: ${target.dir}`);
    if (!inSync) {
      failed = true;
    }
  }

  for (const target of cleanupTargets) {
    const exists = await pathExists(target.dir);
    console.log(`${exists ? "LEGACY" : "OK"} ${target.label}: ${target.dir}`);
    if (exists) {
      failed = true;
    }
  }

  process.exitCode = failed ? 1 : 0;
}

async function runSync() {
  if (!(await pathExists(sourceSkillFile))) {
    throw new Error(`Missing canonical skill source: ${sourceSkillFile}`);
  }

  for (const target of cleanupTargets) {
    const removed = await removeIfExists(target.dir);
    if (removed) {
      console.log(`Removed ${target.label}: ${target.dir}`);
    }
  }

  for (const target of activeTargets) {
    await copyCanonicalSkill(target.dir);
    console.log(`Synced ${target.label}: ${target.dir}`);
  }
}

function printTargets() {
  console.log("Resolved runtime homes:");
  console.log(`- Claude Code: ${runtimeHomes.claude.dir} (${runtimeHomes.claude.source})`);
  console.log(`- OpenClaw: ${runtimeHomes.openclaw.dir} (${runtimeHomes.openclaw.source})`);
  console.log(`- Codex: ${runtimeHomes.codex.dir} (${runtimeHomes.codex.source})`);
  console.log("");
  console.log("Resolved sync targets:");
  for (const target of activeTargets) {
    console.log(`- ${target.label}: ${target.dir}`);
  }
  console.log("");
  console.log("Environment overrides:");
  console.log("- META_KIM_CLAUDE_HOME or CLAUDE_HOME");
  console.log("- META_KIM_OPENCLAW_HOME or OPENCLAW_HOME");
  console.log("- META_KIM_CODEX_HOME or CODEX_HOME");
}

async function main() {
  await resolveTargets();
  if (printTargetsOnly) {
    printTargets();
    return;
  }
  if (checkOnly) {
    await runCheck();
    return;
  }
  await runSync();
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

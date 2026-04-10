#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  ensureProfileState,
  toRepoRelative,
} from "./meta-kim-local-state.mjs";

const sourceArg = process.argv[2];
const applyMode = process.argv.includes("--apply");

if (!sourceArg) {
  console.error("Usage: node scripts/migrate-into-meta-kim.mjs <source-dir> [--apply]");
  process.exit(1);
}

const SAFE_PATTERNS = [
  /^SOUL\.md$/i,
  /^AGENTS\.md$/i,
  /^\.claude\/agents\/.+\.md$/i,
  /^\.claude\/skills\/.+\/SKILL\.md$/i,
  /^contracts\/.+\.(json|ya?ml)$/i,
  /^\.mcp\.json$/i,
  /^skills\/.+\/SKILL\.md$/i,
];

const BLOCKED_PATTERNS = [
  /^\.meta-kim\/state\//i,
  /^memory\//i,
  /^tests\/fixtures\/run-artifacts\//i,
  /^artifacts?\//i,
  /^runs?\//i,
  /\.sqlite$/i,
  /^logs?\//i,
];

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
      continue;
    }
    if (entry.isFile()) {
      yield fullPath;
    }
  }
}

async function classify(sourceDir) {
  const safeFiles = [];
  const blockedFiles = [];
  const reviewFiles = [];
  for await (const filePath of walk(sourceDir)) {
    const rel = path.relative(sourceDir, filePath).replace(/\\/g, "/");
    if (BLOCKED_PATTERNS.some((pattern) => pattern.test(rel))) {
      blockedFiles.push(rel);
      continue;
    }
    if (SAFE_PATTERNS.some((pattern) => pattern.test(rel))) {
      safeFiles.push(rel);
      continue;
    }
    reviewFiles.push(rel);
  }
  return { safeFiles, blockedFiles, reviewFiles };
}

async function main() {
  const sourceDir = path.resolve(process.cwd(), sourceArg);
  const sourceStat = await fs.stat(sourceDir);
  if (!sourceStat.isDirectory()) {
    throw new Error(`Source path is not a directory: ${sourceDir}`);
  }

  const { migrationsDir, metadata } = await ensureProfileState();
  const migrationId = `${path.basename(sourceDir)}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const stagingRoot = path.join(migrationsDir, migrationId);
  const stagedAssetsDir = path.join(stagingRoot, "staged-assets");

  const { safeFiles, blockedFiles, reviewFiles } = await classify(sourceDir);

  if (applyMode) {
    await fs.mkdir(stagedAssetsDir, { recursive: true });
    for (const rel of safeFiles) {
      const src = path.join(sourceDir, rel);
      const dst = path.join(stagedAssetsDir, rel);
      await fs.mkdir(path.dirname(dst), { recursive: true });
      await fs.copyFile(src, dst);
    }
  }

  const manifest = {
    ok: true,
    sourceDir,
    sourceDirRelativeToRepo: toRepoRelative(sourceDir),
    profile: metadata.profile,
    profileKey: metadata.profileKey,
    migrationId,
    applyMode,
    stagedAssetsDir: applyMode ? toRepoRelative(stagedAssetsDir) : null,
    importPolicy: {
      safe: "persona + skill + contract-adjacent assets only",
      blocked: "unverified run state, sqlite indexes, logs, artifacts, memory",
    },
    safeFiles,
    blockedFiles,
    reviewFiles,
  };

  await fs.mkdir(stagingRoot, { recursive: true });
  await fs.writeFile(path.join(stagingRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

import path from "node:path";

/**
 * Build a safe spawnSync payload for invoking Node.js scripts.
 *
 * We intentionally force shell=false on every platform. On Windows,
 * `shell:true` breaks absolute Node paths that contain spaces, e.g.
 * `C:\\Program Files\\nodejs\\node.exe`, and cmd.exe truncates them to
 * `C:\\Program`.
 */
export function buildNodeScriptSpawn(
  nodeExecPath,
  projectDir,
  scriptRelative,
  extraArgs = [],
  langArgs = [],
) {
  return {
    command: nodeExecPath,
    args: [path.join(projectDir, scriptRelative), ...langArgs, ...extraArgs],
    options: {
      cwd: projectDir,
      stdio: "inherit",
      shell: false,
    },
  };
}

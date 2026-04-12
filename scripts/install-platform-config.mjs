export function findskillPackSubdirForPlatform(
  runtimePlatform = process.platform,
) {
  return runtimePlatform === "win32" ? "windows" : "original";
}

export function resolveManifestSkillSubdir(
  skill,
  runtimePlatform = process.platform,
  options = {},
) {
  const { fallbackToFindskillPack = false } = options;

  let subdir = skill.subdir;
  if (skill.subdirTemplate === "{platform}" && skill.subdirMapping) {
    subdir =
      skill.subdirMapping[runtimePlatform] || skill.subdirMapping.default;
  }

  if (!subdir && fallbackToFindskillPack) {
    return findskillPackSubdirForPlatform(runtimePlatform);
  }

  return subdir;
}

export function shouldUseCliShell(runtimePlatform = process.platform) {
  return runtimePlatform === "win32";
}

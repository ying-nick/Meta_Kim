export const MIN_NODE_VERSION = "22.13.0";

export function parseSemver(version) {
  const match = String(version).trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }
  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
  };
}

export function compareSemver(leftVersion, rightVersion) {
  const left = parseSemver(leftVersion);
  const right = parseSemver(rightVersion);
  if (!left || !right) {
    throw new Error(
      `Invalid semver comparison: "${leftVersion}" vs "${rightVersion}"`,
    );
  }

  if (left.major !== right.major) {
    return left.major - right.major;
  }
  if (left.minor !== right.minor) {
    return left.minor - right.minor;
  }
  return left.patch - right.patch;
}

export function isSupportedNodeVersion(
  version,
  minimumVersion = MIN_NODE_VERSION,
) {
  return compareSemver(version, minimumVersion) >= 0;
}

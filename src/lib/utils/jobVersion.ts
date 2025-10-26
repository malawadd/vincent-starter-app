import semver from 'semver';

export type AppData = {
  id: number;
  version: string;
};

export function assertPermittedVersion(
  savedVersion: string,
  userPermittedVersion: string
): string {
  const savedSemver = semver.coerce(savedVersion);
  const permittedSemver = semver.coerce(userPermittedVersion);

  if (!savedSemver || !permittedSemver) {
    throw new Error(
      `Invalid version format. Saved: ${savedVersion}, Permitted: ${userPermittedVersion}`
    );
  }

  if (semver.major(savedSemver) !== semver.major(permittedSemver)) {
    throw new Error(
      `Major version mismatch. User permitted version ${userPermittedVersion} is not compatible with saved version ${savedVersion}`
    );
  }

  if (semver.gt(permittedSemver, savedSemver)) {
    return userPermittedVersion;
  }

  if (semver.eq(permittedSemver, savedSemver)) {
    return savedVersion;
  }

  throw new Error(
    `User permitted version ${userPermittedVersion} is older than saved version ${savedVersion}`
  );
}

type BuildEnvironment = Readonly<Record<string, string | undefined>>

function escapeSwiftString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
}

function shortRevision(value: string | undefined): string | null {
  const revision = value?.trim()
  return revision ? revision.slice(0, 12) : null
}

export function createRuntimeBuildId(
  packageVersion: string,
  environment: BuildEnvironment = process.env,
): string {
  const explicit = environment.WEBSPATIAL_RUNTIME_BUILD_ID?.trim()
  if (explicit) return explicit

  const revision = shortRevision(environment.GITHUB_SHA)
  if (revision) {
    const ref = environment.GITHUB_REF_NAME?.trim() ?? ''
    const prNumber = /^(\d+)(?:\/merge)?$/.exec(ref)?.[1]
    if (prNumber) return `pr-${prNumber}-${revision}`
    if (ref === 'main') return `main-${revision}`
    if (ref === 'stable') return `stable-v${packageVersion}-${revision}`
    return `ci-${revision}`
  }

  return `package-${packageVersion}`
}

export function applyRuntimeBuildMetadata(
  manifestSwift: string,
  shellVersion: string,
  sdkVersion: string,
  environment: BuildEnvironment = process.env,
): string {
  return manifestSwift
    .replace('WS_SHELL_VERSION', escapeSwiftString(shellVersion))
    .replace('WS_SDK_VERSION', escapeSwiftString(sdkVersion))
    .replace(
      'WS_RUNTIME_BUILD_ID',
      escapeSwiftString(createRuntimeBuildId(shellVersion, environment)),
    )
}

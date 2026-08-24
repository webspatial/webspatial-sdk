type BuildEnvironment = Readonly<Record<string, string | undefined>>

function escapeSwiftString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
}

export function createRuntimeBuildId(
  packageVersion: string,
  environment: BuildEnvironment = process.env,
): string {
  const explicit = environment.WEBSPATIAL_RUNTIME_BUILD_ID?.trim()
  if (explicit) return explicit

  // Generic CI metadata belongs to the consuming app, not the platform package.
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

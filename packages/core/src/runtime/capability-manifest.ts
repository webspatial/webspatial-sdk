import type { WebSpatialRuntimeType } from './types'

export const RUNTIME_CAPABILITY_MANIFEST_GLOBAL =
  '__webspatialCapabilities' as const

export type RuntimeCapabilityProviderType = Exclude<
  WebSpatialRuntimeType,
  'puppeteer' | null
>

export type RuntimeCapabilityManifest = {
  manifestVersion: 1
  runtime: {
    type: RuntimeCapabilityProviderType
    version?: string
    buildId: string
  }
  supported: readonly string[]
}

let manifestCache: RuntimeCapabilityManifest | null | undefined

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isProviderType(
  value: unknown,
): value is RuntimeCapabilityProviderType {
  return value === 'visionos' || value === 'picoos'
}

export function parseRuntimeCapabilityManifest(
  value: unknown,
): RuntimeCapabilityManifest | null {
  if (!isRecord(value) || value.manifestVersion !== 1) return null
  if (!isRecord(value.runtime)) return null
  if (!isProviderType(value.runtime.type)) return null
  if (
    typeof value.runtime.buildId !== 'string' ||
    value.runtime.buildId.trim() === ''
  ) {
    return null
  }
  if (
    value.runtime.version !== undefined &&
    (typeof value.runtime.version !== 'string' ||
      value.runtime.version.trim() === '')
  ) {
    return null
  }
  if (
    !Array.isArray(value.supported) ||
    value.supported.some(
      entry => typeof entry !== 'string' || entry.trim() === '',
    )
  ) {
    return null
  }

  const supported = Object.freeze([...new Set(value.supported)])
  const runtime = Object.freeze({
    type: value.runtime.type,
    ...(value.runtime.version === undefined
      ? {}
      : { version: value.runtime.version }),
    buildId: value.runtime.buildId,
  })

  return Object.freeze({
    manifestVersion: 1,
    runtime,
    supported,
  })
}

export function serializeRuntimeCapabilityManifest(
  manifest: RuntimeCapabilityManifest,
): string {
  return JSON.stringify({
    manifestVersion: manifest.manifestVersion,
    runtime: {
      type: manifest.runtime.type,
      ...(manifest.runtime.version === undefined
        ? {}
        : { version: manifest.runtime.version }),
      buildId: manifest.runtime.buildId,
    },
    supported: [...manifest.supported].sort(),
  })
}

export function getRuntimeCapabilityManifest(
  expectedType: RuntimeCapabilityProviderType,
): RuntimeCapabilityManifest | null {
  if (manifestCache === undefined) {
    const candidate = (
      globalThis as typeof globalThis & Record<string, unknown>
    )[RUNTIME_CAPABILITY_MANIFEST_GLOBAL]
    manifestCache = parseRuntimeCapabilityManifest(candidate)
  }
  if (manifestCache?.runtime.type !== expectedType) return null
  return manifestCache
}

export function resetRuntimeCapabilityManifestCacheForTests(): void {
  manifestCache = undefined
}

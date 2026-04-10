import { CAPABILITY_TABLE, type CapabilityVersionRow } from './capability-data'
import { compareSemver, parseSemverOrNull } from './semver'
import type { WebSpatialRuntimeSnapshot } from './types'
import { computeRuntimeFromUserAgent } from './userAgent'
import {
  isKnownSubToken,
  isKnownTopLevel,
  normalizeCapabilityName,
} from './keys'

/**
 * Unsubstituted shell version placeholder from visionOS manifest / Xcode template
 * (`manifest.swift`). When still present in `WSAppShell/<version>`, treat as debug
 * build: {@link supports} returns true for every valid capability query.
 */
export const VISIONOS_DEBUG_SHELL_VERSION_PLACEHOLDER = 'WS_SHELL_VERSION'

let runtimeCache: WebSpatialRuntimeSnapshot | undefined

/** Test helper: clear cached UA/runtime snapshot between Vitest cases. */
export function resetRuntimeCacheForTests(): void {
  runtimeCache = undefined
}

/**
 * Internal runtime snapshot (not part of the public `@webspatial/react-sdk` surface).
 */
export function getRuntime(): WebSpatialRuntimeSnapshot {
  if (runtimeCache !== undefined) return runtimeCache
  if (typeof navigator === 'undefined') {
    runtimeCache = { type: null, shellVersion: null }
    return runtimeCache
  }
  runtimeCache = computeRuntimeFromUserAgent(navigator.userAgent)
  return runtimeCache
}

function selectRow(
  type: 'visionos' | 'picoos',
  shellVersion: string,
): CapabilityVersionRow | null {
  const norm = parseSemverOrNull(shellVersion)
  if (!norm) return null
  const rows = CAPABILITY_TABLE[type]
  if (!rows.length) return null
  const sorted = [...rows].sort((a, b) => compareSemver(a.version, b.version))
  const minV = sorted[0].version
  if (compareSemver(norm, minV) < 0) return null

  let chosen: CapabilityVersionRow | null = null
  for (const row of sorted) {
    if (compareSemver(row.version, norm) <= 0) {
      chosen = row
    } else {
      break
    }
  }
  return chosen
}

/**
 * Public capability probe (`WebSpatialRuntime.supports` re-exports this from React SDK).
 */
export function supports(name: string, tokens?: readonly string[]): boolean {
  if (typeof name !== 'string') return false
  const canonical = normalizeCapabilityName(name)
  if (!isKnownTopLevel(canonical)) return false

  const tokList =
    tokens === undefined ? [] : Array.isArray(tokens) ? [...tokens] : []
  if (tokList.some(t => typeof t !== 'string')) return false

  for (const t of tokList) {
    if (!isKnownSubToken(canonical, t)) return false
  }

  const rt = getRuntime()
  if (rt.type === 'puppeteer') {
    return true
  }
  if (rt.type === null) return false
  if (rt.shellVersion === null) return false

  if (
    rt.type === 'visionos' &&
    rt.shellVersion === VISIONOS_DEBUG_SHELL_VERSION_PLACEHOLDER
  ) {
    return true
  }

  const parsedShell = parseSemverOrNull(rt.shellVersion)
  if (!parsedShell) return false

  if (rt.type !== 'visionos' && rt.type !== 'picoos') return false

  const row = selectRow(rt.type, parsedShell)
  if (!row) return false

  if (tokList.length === 0) {
    return row.flags[canonical] === true
  }
  if (row.flags[canonical] !== true) return false
  return tokList.every(t => row.flags[`${canonical}:${t}`] === true)
}

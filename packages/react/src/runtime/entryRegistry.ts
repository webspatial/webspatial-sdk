/**
 * Tracks which published React SDK entry root (`lazy` default vs `eager`) has
 * been loaded in the current JS realm. Per spatial-lazy-load "Mixed-import
 * shape is rejected" — mixing both roots in one bundle is unsupported.
 *
 * Enforcement is disabled under Vitest unless a test opts in via
 * `__setEntryRegistryEnforcementForTests(true)` so suites that import both
 * entries for export-shape comparison keep working.
 */

export type ReactSdkEntryKind = 'lazy' | 'eager'

const REGISTRY_KEY = '__WEBSPATIAL_REACT_SDK_ENTRY__'

let hasReportedMixed = false
let enforcementEnabled = true

export class WebSpatialMixedEntryError extends Error {
  readonly previous: ReactSdkEntryKind
  readonly next: ReactSdkEntryKind

  constructor(previous: ReactSdkEntryKind, next: ReactSdkEntryKind) {
    const prevPath =
      previous === 'eager'
        ? '@webspatial/react-sdk/eager'
        : '@webspatial/react-sdk'
    const nextPath =
      next === 'eager' ? '@webspatial/react-sdk/eager' : '@webspatial/react-sdk'
    super(
      `Mixed @webspatial/react-sdk entry roots: already loaded ${prevPath}, then ${nextPath}. ` +
        'Use exactly one import root per application bundle (including transitive dependencies).',
    )
    this.name = 'WebSpatialMixedEntryError'
    this.previous = previous
    this.next = next
  }
}

type RegistryGlobal = typeof globalThis & {
  [REGISTRY_KEY]?: ReactSdkEntryKind
  __WEBSPATIAL_ENTRY_REGISTRY_ENFORCE__?: boolean
}

function registryGlobal(): RegistryGlobal {
  return globalThis as RegistryGlobal
}

function shouldEnforce(): boolean {
  if (!enforcementEnabled) return false
  if (
    typeof process !== 'undefined' &&
    process.env.VITEST === 'true' &&
    !registryGlobal().__WEBSPATIAL_ENTRY_REGISTRY_ENFORCE__
  ) {
    return false
  }
  return true
}

/**
 * Called at module-evaluation time from `src/index.ts` (lazy) and
 * `src/eager.ts` (eager). Idempotent when the same kind registers twice.
 */
export function registerReactSdkEntry(kind: ReactSdkEntryKind): void {
  const g = registryGlobal()
  const previous = g[REGISTRY_KEY]
  if (previous === kind) return
  if (previous !== undefined) {
    if (hasReportedMixed) return
    hasReportedMixed = true
    const error = new WebSpatialMixedEntryError(previous, kind)
    if (shouldEnforce()) {
      throw error
    }
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV !== 'production'
    ) {
      // eslint-disable-next-line no-console
      console.error(`[WebSpatial] ${error.message}`)
    }
    return
  }
  g[REGISTRY_KEY] = kind
}

export function getRegisteredReactSdkEntry(): ReactSdkEntryKind | undefined {
  return registryGlobal()[REGISTRY_KEY]
}

export function __setEntryRegistryEnforcementForTests(enabled: boolean): void {
  enforcementEnabled = enabled
  registryGlobal().__WEBSPATIAL_ENTRY_REGISTRY_ENFORCE__ = enabled
}

export function __resetEntryRegistryForTests(): void {
  hasReportedMixed = false
  enforcementEnabled = true
  const g = registryGlobal()
  delete g[REGISTRY_KEY]
  delete g.__WEBSPATIAL_ENTRY_REGISTRY_ENFORCE__
}

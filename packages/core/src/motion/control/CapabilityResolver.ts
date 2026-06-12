import { supports } from '../../runtime/supports'
import type { SpatializedMotionKind } from '../../types/spatializedMotion'

/**
 * Resolves whether a motion kind should run on the native backend.
 *
 * Extracted as an injectable strategy so the previous three-tier inline logic
 * (`forceNativePlayback` → `supportsMotionKind` → `supports('useAnimation')`)
 * lives in one place and the test seams no longer leak as ad-hoc branches inside
 * the controller. Production injects {@link runtimeCapabilityResolver}; tests and
 * React inject a mock via the controller options.
 */
export interface CapabilityResolver {
  supports(kind: SpatializedMotionKind): boolean
}

/** Default resolver backed by the real `supports('useAnimation', [...])` probe. */
export const runtimeCapabilityResolver: CapabilityResolver = {
  supports(kind: SpatializedMotionKind): boolean {
    const token = kind === 'spatialized2d' ? 'element' : kind
    return supports('useAnimation', [token])
  },
}

/**
 * Create a capability resolver from legacy controller options kept for
 * backward compatibility.
 */
export function createCapabilityResolverFromOptions(opts: {
  forceNativePlayback?: boolean
  supportsMotionKind?: (kind: SpatializedMotionKind) => boolean
}): CapabilityResolver {
  if (opts.forceNativePlayback !== undefined) {
    const value = opts.forceNativePlayback
    return { supports: () => value }
  }
  if (opts.supportsMotionKind) {
    const fn = opts.supportsMotionKind
    return { supports: kind => fn(kind) }
  }
  return runtimeCapabilityResolver
}

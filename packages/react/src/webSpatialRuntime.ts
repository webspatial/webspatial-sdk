import { supports } from './runtime/capabilities'

/**
 * Runtime capability checks (`supports('Model')`, `supports('WindowScene', ['defaultSize'])`, ...).
 * Spec: `openspec/specs/runtime-capabilities/spec.md`.
 */
export const WebSpatialRuntime = {
  supports,
} as const

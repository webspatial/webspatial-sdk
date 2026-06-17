import { defaultOpacityPlugin } from './defaultOpacityPlugin'
import type { MotionFieldPlugin, MotionOwnershipField } from './types'

/** Default field list enabled in the minimal ownership plugin rollout. */
const DEFAULT_MOTION_OWNERSHIP_FIELDS: readonly MotionOwnershipField[] = [
  'opacity',
]

/** Default plugin lookup table keyed by field name. */
const DEFAULT_MOTION_FIELD_PLUGINS: Readonly<
  Record<MotionOwnershipField, MotionFieldPlugin>
> = {
  opacity: defaultOpacityPlugin,
}

/**
 * Returns the enabled ownership fields for the default runtime registry.
 *
 * @returns The default ownership-managed field list.
 */
export function getMotionOwnershipFields(): readonly MotionOwnershipField[] {
  return DEFAULT_MOTION_OWNERSHIP_FIELDS
}

/**
 * Returns the default ownership plugin for a field, if one exists.
 *
 * @param field - The field whose plugin should be resolved.
 * @returns The field plugin or `null` when no plugin is registered.
 */
export function getMotionFieldPlugin(
  field: MotionOwnershipField,
): MotionFieldPlugin | null {
  return DEFAULT_MOTION_FIELD_PLUGINS[field] ?? null
}

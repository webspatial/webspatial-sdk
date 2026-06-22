import { defaultOpacityPlugin } from './defaultOpacityPlugin'
import { defaultTransformPlugin } from './defaultTransformPlugin'
import type {
  MotionFieldDescriptor,
  MotionFieldPlugin,
  MotionOwnershipField,
} from './types'

/** Default field list enabled in the minimal ownership plugin rollout. */
const DEFAULT_MOTION_OWNERSHIP_FIELDS: readonly MotionOwnershipField[] = [
  'opacity',
  'transform',
]

/** Default plugin lookup table keyed by field name. */
const DEFAULT_MOTION_FIELD_PLUGINS: Readonly<
  Record<MotionOwnershipField, MotionFieldDescriptor>
> = {
  opacity: defaultOpacityPlugin,
  transform: defaultTransformPlugin,
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
 * Returns the enabled field descriptors for the default runtime registry.
 *
 * @returns The default ownership-managed field descriptors.
 */
export function getMotionFieldDescriptors(): readonly MotionFieldDescriptor[] {
  return DEFAULT_MOTION_OWNERSHIP_FIELDS.map(
    field => DEFAULT_MOTION_FIELD_PLUGINS[field],
  )
}

/**
 * Returns the default field descriptor for a field, if one exists.
 *
 * @param field - The field whose descriptor should be resolved.
 * @returns The field descriptor or `null` when no descriptor is registered.
 */
export function getMotionFieldDescriptor(
  field: MotionOwnershipField,
): MotionFieldDescriptor | null {
  return DEFAULT_MOTION_FIELD_PLUGINS[field] ?? null
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
  return getMotionFieldDescriptor(field)
}

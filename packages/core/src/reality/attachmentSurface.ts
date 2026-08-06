import type { BackgroundMaterialType, CornerRadius } from '../types/types'

export const ATTACHMENT_BACKGROUND_MATERIAL_VALUES = new Set<string>([
  'none',
  'transparent',
  'translucent',
  'thin',
  'regular',
  'thick',
])

export const DEFAULT_ATTACHMENT_BACKGROUND_MATERIAL: BackgroundMaterialType =
  'transparent'

/**
 * Expands the public single-number attachment corner radius into the internal
 * four-corner CornerRadius command shape. Missing, negative, or non-finite
 * values fall back to 0 for all corners.
 */
export function normalizeAttachmentCornerRadius(value: unknown): CornerRadius {
  const radius =
    typeof value === 'number' && Number.isFinite(value) && value >= 0
      ? value
      : 0
  return {
    topLeading: radius,
    bottomLeading: radius,
    topTrailing: radius,
    bottomTrailing: radius,
  }
}

/**
 * Missing or invalid materials fall back to 'transparent'.
 */
export function normalizeAttachmentBackgroundMaterial(
  value: unknown,
): BackgroundMaterialType {
  return typeof value === 'string' &&
    ATTACHMENT_BACKGROUND_MATERIAL_VALUES.has(value)
    ? (value as BackgroundMaterialType)
    : DEFAULT_ATTACHMENT_BACKGROUND_MATERIAL
}

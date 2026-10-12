import type { BackgroundMaterialType, CornerRadius } from '../types/types'

export const ATTACHMENT_BACKGROUND_MATERIAL_VALUES = new Set([
  'none',
  'transparent',
  'translucent',
  'thin',
  'regular',
  'thick',
])

export const DEFAULT_ATTACHMENT_BACKGROUND_MATERIAL: BackgroundMaterialType =
  'transparent'

export function normalizeAttachmentCornerRadius(
  value: number | undefined,
): CornerRadius {
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

export function normalizeAttachmentBackgroundMaterial(
  value: BackgroundMaterialType | undefined,
): BackgroundMaterialType {
  return typeof value === 'string' &&
    ATTACHMENT_BACKGROUND_MATERIAL_VALUES.has(value)
    ? value
    : DEFAULT_ATTACHMENT_BACKGROUND_MATERIAL
}

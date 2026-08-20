import { BackgroundMaterial, CornerRadius } from '../types/types'

export type OrnamentVisibility = 'visible' | 'hidden'

export interface OrnamentOptions {
  attachmentAnchor?: string
  contentAlignment?: string
  visibility?: string
  width?: number
  height?: number
  cornerRadius?: Partial<CornerRadius>
  backgroundMaterial?: BackgroundMaterial
}

export interface NormalizedOrnamentOptions {
  attachmentAnchor: string
  contentAlignment: string
  visibility: OrnamentVisibility
  width: number
  height: number
  cornerRadius: CornerRadius
  backgroundMaterial: BackgroundMaterial
}

export interface OrnamentRecord {
  id: string
  type: 'Ornament'
  options: NormalizedOrnamentOptions
  active: boolean
  order: number
}

const ORNAMENT_POINTS = new Set([
  'topLeadingFront',
  'topLeading',
  'topLeadingBack',
  'topFront',
  'top',
  'topBack',
  'topTrailingFront',
  'topTrailing',
  'topTrailingBack',
  'leadingFront',
  'leading',
  'leadingBack',
  'front',
  'center',
  'back',
  'trailingFront',
  'trailing',
  'trailingBack',
  'bottomLeadingFront',
  'bottomLeading',
  'bottomLeadingBack',
  'bottomFront',
  'bottom',
  'bottomBack',
  'bottomTrailingFront',
  'bottomTrailing',
  'bottomTrailingBack',
])

const INVALID_ATTACHMENT_ANCHORS = new Set(['topFront', 'top', 'topBack'])

const DEFAULT_ORNAMENT_OPTIONS: NormalizedOrnamentOptions = {
  attachmentAnchor: 'bottom',
  contentAlignment: 'back',
  visibility: 'visible',
  width: 200,
  height: 150,
  cornerRadius: {
    topLeading: 0,
    bottomLeading: 0,
    topTrailing: 0,
    bottomTrailing: 0,
  },
  backgroundMaterial: BackgroundMaterial.none,
}

function normalizeRadiusValue(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : fallback
}

export function normalizeOrnamentOptions(
  options: OrnamentOptions = {},
): NormalizedOrnamentOptions {
  const attachmentAnchor =
    typeof options.attachmentAnchor === 'string' &&
    ORNAMENT_POINTS.has(options.attachmentAnchor) &&
    !INVALID_ATTACHMENT_ANCHORS.has(options.attachmentAnchor)
      ? options.attachmentAnchor
      : DEFAULT_ORNAMENT_OPTIONS.attachmentAnchor

  const contentAlignment =
    typeof options.contentAlignment === 'string' &&
    ORNAMENT_POINTS.has(options.contentAlignment)
      ? options.contentAlignment
      : DEFAULT_ORNAMENT_OPTIONS.contentAlignment

  const visibility =
    options.visibility === 'hidden' || options.visibility === 'visible'
      ? options.visibility
      : DEFAULT_ORNAMENT_OPTIONS.visibility

  const width =
    typeof options.width === 'number' &&
    Number.isFinite(options.width) &&
    options.width > 0
      ? options.width
      : DEFAULT_ORNAMENT_OPTIONS.width

  const height =
    typeof options.height === 'number' &&
    Number.isFinite(options.height) &&
    options.height > 0
      ? options.height
      : DEFAULT_ORNAMENT_OPTIONS.height

  const cornerRadius = {
    topLeading: normalizeRadiusValue(
      options.cornerRadius?.topLeading,
      DEFAULT_ORNAMENT_OPTIONS.cornerRadius.topLeading,
    ),
    bottomLeading: normalizeRadiusValue(
      options.cornerRadius?.bottomLeading,
      DEFAULT_ORNAMENT_OPTIONS.cornerRadius.bottomLeading,
    ),
    topTrailing: normalizeRadiusValue(
      options.cornerRadius?.topTrailing,
      DEFAULT_ORNAMENT_OPTIONS.cornerRadius.topTrailing,
    ),
    bottomTrailing: normalizeRadiusValue(
      options.cornerRadius?.bottomTrailing,
      DEFAULT_ORNAMENT_OPTIONS.cornerRadius.bottomTrailing,
    ),
  }

  const backgroundMaterial =
    options.backgroundMaterial !== undefined &&
    Object.values(BackgroundMaterial).includes(options.backgroundMaterial)
      ? options.backgroundMaterial
      : DEFAULT_ORNAMENT_OPTIONS.backgroundMaterial

  return {
    attachmentAnchor,
    contentAlignment,
    visibility,
    width,
    height,
    cornerRadius,
    backgroundMaterial,
  }
}

export function createOrnamentRecord(
  id: string,
  options: OrnamentOptions,
  existing: OrnamentRecord | undefined,
  order: number,
): OrnamentRecord {
  return {
    id,
    type: 'Ornament',
    options: normalizeOrnamentOptions({
      ...existing?.options,
      ...options,
    }),
    active: existing?.active ?? false,
    order: existing?.order ?? order,
  }
}

export function updateOrnamentRecord(
  ornament: OrnamentRecord,
  options: OrnamentOptions = {},
): OrnamentRecord {
  return {
    ...ornament,
    options: normalizeOrnamentOptions({
      ...ornament.options,
      ...options,
      cornerRadius:
        options.cornerRadius === undefined
          ? ornament.options.cornerRadius
          : {
              ...ornament.options.cornerRadius,
              ...(options.cornerRadius ?? {}),
            },
    }),
  }
}

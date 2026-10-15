import { UpdateOrnamentCommand } from './JSBCommand'
import { hijackWindowATag } from './scene-polyfill'
import { createNativeOrnament } from './spatial-host'
import { SpatialObject } from './SpatialObject'
import type { BackgroundMaterialType, CornerRadius } from './types/types'

export type OrnamentVisibility = 'visible' | 'hidden'

export type OrnamentPoint3D =
  | 'topLeadingFront'
  | 'topLeading'
  | 'topLeadingBack'
  | 'topFront'
  | 'top'
  | 'topBack'
  | 'topTrailingFront'
  | 'topTrailing'
  | 'topTrailingBack'
  | 'leadingFront'
  | 'leading'
  | 'leadingBack'
  | 'front'
  | 'center'
  | 'back'
  | 'trailingFront'
  | 'trailing'
  | 'trailingBack'
  | 'bottomLeadingFront'
  | 'bottomLeading'
  | 'bottomLeadingBack'
  | 'bottomFront'
  | 'bottom'
  | 'bottomBack'
  | 'bottomTrailingFront'
  | 'bottomTrailing'
  | 'bottomTrailingBack'

export type OrnamentOptions = {
  attachmentAnchor?: OrnamentPoint3D
  contentAlignment?: OrnamentPoint3D
  visibility?: OrnamentVisibility
  width?: number
  height?: number
  cornerRadius?: Partial<CornerRadius>
  backgroundMaterial?: BackgroundMaterialType
}

export type NormalizedOrnamentOptions = Omit<
  Required<OrnamentOptions>,
  'cornerRadius'
> & {
  cornerRadius: CornerRadius
}

export type OrnamentProtocolOptions = Omit<
  NormalizedOrnamentOptions,
  'cornerRadius'
> & {
  cornerRadius: string
}

export const ORNAMENT_POINT_3D_VALUES = [
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
] as const

const ORNAMENT_POINT_3D_SET = new Set<string>(ORNAMENT_POINT_3D_VALUES)
const INVALID_ATTACHMENT_ANCHORS = new Set<string>([
  'topFront',
  'top',
  'topBack',
])
const ORNAMENT_BACKGROUND_MATERIAL_VALUES = new Set<string>([
  'none',
  'translucent',
  'thick',
  'regular',
  'thin',
  'transparent',
])

export const DEFAULT_ORNAMENT_OPTIONS: NormalizedOrnamentOptions = {
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
  backgroundMaterial: 'none',
}

function normalizeAttachmentAnchor(value: unknown): OrnamentPoint3D {
  if (
    typeof value === 'string' &&
    ORNAMENT_POINT_3D_SET.has(value) &&
    !INVALID_ATTACHMENT_ANCHORS.has(value)
  ) {
    return value as OrnamentPoint3D
  }
  return DEFAULT_ORNAMENT_OPTIONS.attachmentAnchor
}

function normalizeContentAlignment(value: unknown): OrnamentPoint3D {
  if (typeof value === 'string' && ORNAMENT_POINT_3D_SET.has(value)) {
    return value as OrnamentPoint3D
  }
  return DEFAULT_ORNAMENT_OPTIONS.contentAlignment
}

function normalizeVisibility(value: unknown): OrnamentVisibility {
  return value === 'hidden' || value === 'visible'
    ? value
    : DEFAULT_ORNAMENT_OPTIONS.visibility
}

function normalizeSize(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : fallback
}

function normalizeRadiusValue(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : fallback
}

function normalizeCornerRadius(
  value: OrnamentOptions['cornerRadius'],
  fallback: CornerRadius = DEFAULT_ORNAMENT_OPTIONS.cornerRadius,
): CornerRadius {
  return {
    topLeading: normalizeRadiusValue(value?.topLeading, fallback.topLeading),
    bottomLeading: normalizeRadiusValue(
      value?.bottomLeading,
      fallback.bottomLeading,
    ),
    topTrailing: normalizeRadiusValue(value?.topTrailing, fallback.topTrailing),
    bottomTrailing: normalizeRadiusValue(
      value?.bottomTrailing,
      fallback.bottomTrailing,
    ),
  }
}

function normalizeBackgroundMaterial(value: unknown): BackgroundMaterialType {
  if (
    typeof value === 'string' &&
    ORNAMENT_BACKGROUND_MATERIAL_VALUES.has(value)
  ) {
    return value as BackgroundMaterialType
  }
  return DEFAULT_ORNAMENT_OPTIONS.backgroundMaterial
}

export function normalizeOrnamentOptions(
  options: OrnamentOptions = {},
): NormalizedOrnamentOptions {
  return {
    attachmentAnchor: normalizeAttachmentAnchor(options.attachmentAnchor),
    contentAlignment: normalizeContentAlignment(options.contentAlignment),
    visibility: normalizeVisibility(options.visibility),
    width: normalizeSize(options.width, DEFAULT_ORNAMENT_OPTIONS.width),
    height: normalizeSize(options.height, DEFAULT_ORNAMENT_OPTIONS.height),
    cornerRadius: normalizeCornerRadius(options.cornerRadius),
    backgroundMaterial: normalizeBackgroundMaterial(options.backgroundMaterial),
  }
}

export function serializeOrnamentOptionsForProtocol(
  options: NormalizedOrnamentOptions,
): OrnamentProtocolOptions {
  return {
    ...options,
    cornerRadius: JSON.stringify(options.cornerRadius),
  }
}

export class Ornament extends SpatialObject {
  private options: NormalizedOrnamentOptions

  constructor(
    id: string,
    private readonly windowProxy: WindowProxy,
    options: OrnamentOptions,
  ) {
    super(id)
    this.options = normalizeOrnamentOptions(options)
    hijackWindowATag(windowProxy)
  }

  getContainer(): HTMLElement {
    return (this.windowProxy as Window).document.body
  }

  getWindowProxy(): WindowProxy {
    return this.windowProxy
  }

  getOptions(): NormalizedOrnamentOptions {
    return this.options
  }

  async update(options: OrnamentOptions) {
    if (this.isDestroyed) return
    const nextOptions = normalizeOrnamentOptions({
      ...this.options,
      ...options,
      cornerRadius:
        options.cornerRadius === undefined
          ? this.options.cornerRadius
          : {
              ...this.options.cornerRadius,
              ...(options.cornerRadius ?? {}),
            },
    })
    this.options = nextOptions
    return new UpdateOrnamentCommand(this.id, nextOptions).execute()
  }

  protected override onDestroy() {
    this.windowProxy.close?.()
  }
}

export async function createOrnament(
  options: OrnamentOptions = {},
): Promise<Ornament> {
  const normalizedOptions = normalizeOrnamentOptions(options)
  const result = await createNativeOrnament(
    serializeOrnamentOptionsForProtocol(normalizedOptions),
  )
  if (!result.success) {
    throw new Error('createOrnament failed: ' + result?.errorMessage)
  }
  const { id, windowProxy } = result.data!
  windowProxy.document.head.innerHTML = `<meta name="viewport" content="width=device-width, initial-scale=1">
      <base href="${document.baseURI}">`
  return new Ornament(id, windowProxy, normalizedOptions)
}

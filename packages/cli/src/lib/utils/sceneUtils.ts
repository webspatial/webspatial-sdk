export interface SpatialSceneCreationOptions {
  defaultSize?: {
    width: number | string // Initial width of the window
    height: number | string // Initial height of the window
    depth?: number | string // Initial depth of the window, only for volume
  }

  resizability?: {
    minWidth?: number | string // Minimum width of the window
    minHeight?: number | string // Minimum height of the window
    maxWidth?: number | string // Maximum width of the window
    maxHeight?: number | string // Maximum height of the window
  }
  worldScaling?: WorldScalingType
  worldAlignment?: WorldAlignmentType

  baseplateVisibility?: BaseplateVisibilityType
}
export const BaseplateVisibilityValues = [
  'automatic',
  'visible',
  'hidden',
] as const
export type BaseplateVisibilityType = (typeof BaseplateVisibilityValues)[number]

export function isValidBaseplateVisibilityType(type: string): Boolean {
  return BaseplateVisibilityValues.includes(type as BaseplateVisibilityType)
}

export const WorldScalingValues = ['automatic', 'dynamic'] as const
export type WorldScalingType = (typeof WorldScalingValues)[number]

export function isValidWorldScalingType(type: string): Boolean {
  return WorldScalingValues.includes(type as WorldScalingType)
}

export const WorldAlignmentValues = [
  'adaptive',
  'automatic',
  'gravityAligned',
] as const
export type WorldAlignmentType = (typeof WorldAlignmentValues)[number]

export function isValidWorldAlignmentType(type: string): Boolean {
  return WorldAlignmentValues.includes(type as WorldAlignmentType)
}

export const SpatialSceneValues = ['window', 'volume'] as const
export type SpatialSceneType = (typeof SpatialSceneValues)[number]

export function isValidSpatialSceneType(type: string): Boolean {
  return SpatialSceneValues.includes(type as SpatialSceneType)
}

export type SpatialSceneCreationOptionsInternal =
  SpatialSceneCreationOptions & {
    type: SpatialSceneType
  }

function pxToMeter(px: number): number {
  return px / 1360
}

function meterToPx(meter: number): number {
  return meter * 1360
}

export function formatToNumber(
  str: string | number,
  targetUnit: 'px' | 'm',
  defaultUnit: 'px' | 'm',
): number {
  if (typeof str === 'number') {
    if (
      (defaultUnit === 'px' && targetUnit === 'px') ||
      (defaultUnit === 'm' && targetUnit === 'm')
    ) {
      return str
    }
    // unit not match target
    if (defaultUnit === 'px' && targetUnit === 'm') {
      return pxToMeter(str)
    } else if (defaultUnit === 'm' && targetUnit === 'px') {
      return meterToPx(str)
    }
    // fallback
    return str
  }
  if (targetUnit === 'm') {
    if (str.endsWith('m')) {
      // 1m
      return Number(str.slice(0, -1))
    } else if (str.endsWith('px')) {
      // 100px
      return pxToMeter(Number(str.slice(0, -2)))
    } else {
      throw new Error('formatToNumber: invalid str')
    }
  } else if (targetUnit === 'px') {
    if (str.endsWith('px')) {
      // 100px
      return Number(str.slice(0, -2))
    } else if (str.endsWith('m')) {
      // 1m
      return meterToPx(Number(str.slice(0, -1)))
    } else {
      throw new Error('formatToNumber: invalid str')
    }
  } else {
    throw new Error('formatToNumber: invalid targetUnit')
  }
}

export function formatSceneConfig(
  config: SpatialSceneCreationOptions,
  sceneType: SpatialSceneType,
) {
  // defaultSize and resizability's width/height/depth can be 100 or "100px" or "1m"
  // expect:
  // resizability should format into px
  // defaultSize should format into px if window
  // defaultSize should format into m if volume

  const isWindow = sceneType === 'window'
  // const isVolume = sceneType === 'volume'

  // format resizability
  if (config.resizability) {
    const iterKeys = Object.keys(config.resizability)

    for (let k of iterKeys) {
      if ((config.resizability as any)[k]) {
        ;(config.resizability as any)[k] = formatToNumber(
          (config.resizability as any)[k],
          'px',
          isWindow ? 'px' : 'm',
        )
      }
    }
  }

  // format defaultSize
  if (config.defaultSize) {
    const iterKeys = Object.keys(config.defaultSize)
    for (let k of iterKeys) {
      if ((config.defaultSize as any)[k]) {
        ;(config.defaultSize as any)[k] = formatToNumber(
          (config.defaultSize as any)[k],
          isWindow ? 'px' : 'm',
          isWindow ? 'px' : 'm',
        )
      }
    }
  }
  return config
}

/**
 * check px,m and number, number must be >= 0
 *
 * */
export function isValidSceneUnit(val: string | number): boolean {
  // only support number or string with unit px or m
  // rpx cm mm not allowed
  if (typeof val === 'number') {
    return val >= 0
  }
  if (typeof val === 'string') {
    if (val.endsWith('px')) {
      // check if number
      if (isNaN(Number(val.slice(0, -2)))) {
        return false
      }
      return Number(val.slice(0, -2)) >= 0
    }
    if (val.endsWith('m')) {
      // check if number
      if (isNaN(Number(val.slice(0, -1)))) {
        return false
      }
      return Number(val.slice(0, -1)) >= 0
    }
  }
  return false
}

export const defaultSceneConfig: SpatialSceneCreationOptions = {
  defaultSize: {
    width: 1280,
    height: 720,
    depth: 0,
  },
}

export const defaultSceneConfigVolume: SpatialSceneCreationOptions = {
  defaultSize: {
    width: 0.94,
    height: 0.94,
    depth: 0.94,
  },
}

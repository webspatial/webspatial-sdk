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
  worldScaling?: worldScalingType
  worldAlignment?: worldAlignmentType

  baseplateVisibility?: baseplateVisibilityType
}

export type baseplateVisibilityType = 'automatic' | 'visible' | 'hidden'

export type worldScalingType = 'automatic' | 'dynamic'
export type worldAlignmentType = 'adaptive' | 'automatic' | 'gravityAligned'

export type SpatialSceneType = 'window' | 'volume'

export type SpatialSceneCreationOptionsJSB = SpatialSceneCreationOptions & {
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

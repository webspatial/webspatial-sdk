import { PartialSpatialTransformType, SpatialTransformType } from './types'

export function PopulatePartialSpatialTransformType(
  spatialTransform: PartialSpatialTransformType = {},
): SpatialTransformType {
  const {
    position = { x: 0, y: 0, z: 0 },
    rotation = { x: 0, y: 0, z: 0, w: 1 },
    scale = { x: 1, y: 1, z: 1 },
  } = spatialTransform
  const { x: tx = 0, y: ty = 0, z: tz = 0 } = position
  const { x: rx = 0, y: ry = 0, z: rz = 0, w = 1 } = rotation
  const { x: sx = 1, y: sy = 1, z: sz = 1 } = scale

  return {
    position: { x: tx, y: ty, z: tz },
    rotation: { x: rx, y: ry, z: rz, w },
    scale: { x: sx, y: sy, z: sz },
  }
}

export function getAbsoluteURL(url: string) {
  if (!url) {
    return ''
  }
  if (url.startsWith('http')) {
    return url
  }
  return `${location.origin}${url}`
}

import { Point3D, SpatializedElementRef } from './types'

export function toSceneSpatial(
  point: Point3D,
  spatializedElement: SpatializedElementRef,
): DOMPoint {
  return (spatializedElement as any).__toSceneSpace(point)
}

export function toLocalSpace(
  point: Point3D,
  spatializedElement: SpatializedElementRef,
): DOMPoint {
  return (spatializedElement as any).__toLocalSpace(point)
}

export function convertDOMRectToSceneSpace(
  originalRect: DOMRect,
  matrix: DOMMatrix,
) {
  const topLeft = new DOMPoint(originalRect.left, originalRect.top)
  const topRight = new DOMPoint(originalRect.right, originalRect.top)
  const bottomRight = new DOMPoint(originalRect.right, originalRect.bottom)
  const bottomLeft = new DOMPoint(originalRect.left, originalRect.bottom)
  const transformedTopLeft = matrix.transformPoint(topLeft)
  const transformedTopRight = matrix.transformPoint(topRight)
  const transformedBottomRight = matrix.transformPoint(bottomRight)
  const transformedBottomLeft = matrix.transformPoint(bottomLeft)

  const allPoints = [
    transformedTopLeft,
    transformedTopRight,
    transformedBottomRight,
    transformedBottomLeft,
  ]
  const xCoords = allPoints.map(point => point.x)
  const yCoords = allPoints.map(point => point.y)

  const newMinX = Math.min(...xCoords)
  const newMaxX = Math.max(...xCoords)
  const newMinY = Math.min(...yCoords)
  const newMaxY = Math.max(...yCoords)

  return new DOMRect(newMinX, newMinY, newMaxX - newMinX, newMaxY - newMinY)
}

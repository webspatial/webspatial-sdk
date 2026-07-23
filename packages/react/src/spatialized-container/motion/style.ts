import type { CSSProperties } from 'react'
import type { SpatializedVisualValues } from '@webspatial/core-sdk'

/** Convert evaluated values to React style for SpatialDiv host/probe. */
export function valuesToMotionStyle(
  values: SpatializedVisualValues,
): CSSProperties {
  const style: CSSProperties = {}

  if (values.opacity !== undefined) {
    style.opacity = values.opacity
  }

  const t = values.transform
  if (t) {
    const parts: string[] = []
    const tr = t.translate
    if (
      tr &&
      (tr.x !== undefined || tr.y !== undefined || tr.z !== undefined)
    ) {
      parts.push(`translate3d(${tr.x ?? 0}px, ${tr.y ?? 0}px, ${tr.z ?? 0}px)`)
    }
    const rot = t.rotate
    if (rot) {
      if (rot.z !== undefined) parts.push(`rotateZ(${rot.z}deg)`)
      if (rot.y !== undefined) parts.push(`rotateY(${rot.y}deg)`)
      if (rot.x !== undefined) parts.push(`rotateX(${rot.x}deg)`)
    }
    const sc = t.scale
    if (sc) {
      if (sc.x !== undefined) parts.push(`scaleX(${sc.x})`)
      if (sc.y !== undefined) parts.push(`scaleY(${sc.y})`)
      if (sc.z !== undefined) parts.push(`scaleZ(${sc.z})`)
    }
    if (parts.length > 0) {
      style.transform = parts.join(' ')
    }
  }

  return style
}

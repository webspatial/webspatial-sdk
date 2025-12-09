export function shallowEqualVec3(
  a?: { x: number; y: number; z: number },
  b?: { x: number; y: number; z: number },
) {
  if (a === b) return true
  if (!a || !b) return false
  return a.x === b.x && a.y === b.y && a.z === b.z
}

export function shallowEqualRotation(a?: any, b?: any) {
  if (a === b) return true
  if (!a || !b) return false
  // support Vec3 / Vec4
  return (
    a.x === b.x && a.y === b.y && a.z === b.z && ('w' in a ? a.w === b.w : true)
  )
}

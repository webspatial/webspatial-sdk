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

export function shallowEqualObject(
  a?: Record<string, any>,
  b?: Record<string, any>,
) {
  if (a === b) return true
  if (!a || !b) return false
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  return keysA.every(key => a[key] === b[key])
}

export function shallowEqualArray(a?: any[], b?: any[]) {
  if (a === b) return true
  if (!a || !b) return false
  if (a.length !== b.length) return false
  return a.every((val, i) => val === b[i])
}

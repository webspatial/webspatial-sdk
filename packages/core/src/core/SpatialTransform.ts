export class Vec3 {
  constructor(
    public x = 0,
    public y = 0,
    public z = 0,
  ) {}
}

export class Vec4 {
  constructor(
    public x = 0,
    public y = 0,
    public z = 0,
    public w = 1,
  ) {}
}

/**
 * Transform containing position, orientation and scale
 */
export class SpatialTransform {
  position = new Vec3(0, 0, 0)
  /** Quaternion value for x,y,z,w */
  orientation = new Vec4(0, 0, 0, 1)
  scale = new Vec3(1, 1, 1)
}

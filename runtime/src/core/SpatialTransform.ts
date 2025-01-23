/**
 * Transform containing position, orientation and scale
 * [TODO] is DOMPoint the right type to use?
 */
export class SpatialTransform {
  position = new DOMPoint(0, 0, 0)
  /** Quaternion value for x,y,z,y */
  orientation = new DOMPoint(0, 0, 0, 1)
  scale = new DOMPoint(1, 1, 1)
}

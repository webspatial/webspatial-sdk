import { SpatialObject } from './SpatialObject'

export class SpatialEntity extends SpatialObject {
  constructor(
    id: string,
    public name?: string,
  ) {
    super(id)
  }
}

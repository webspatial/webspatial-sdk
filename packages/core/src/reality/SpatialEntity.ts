import { AddComponentToEntityCommand } from '../JSBCommand'
import { SpatialObject } from '../SpatialObject'
import { SpatialComponent } from './component/SpatialComponent'

export class SpatialEntity extends SpatialObject {
  constructor(
    id: string,
    public name?: string,
  ) {
    super(id)
  }

  async addComponent(component: SpatialComponent) {
    return new AddComponentToEntityCommand(this, component).execute()
  }
}

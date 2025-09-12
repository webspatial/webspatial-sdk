import { ModelComponentOptions } from '../../types/types'
import { SpatialComponent } from './SpatialComponent'

export class ModelComponent extends SpatialComponent {
  constructor(
    id: string,
    public options: ModelComponentOptions,
  ) {
    super(id)
  }
}

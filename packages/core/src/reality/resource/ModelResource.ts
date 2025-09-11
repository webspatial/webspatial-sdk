import { ModelResourceOptions } from '../../types/types'

export class ModelResource {
  constructor(
    public id: string,
    public options: ModelResourceOptions,
  ) {}
}

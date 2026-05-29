import {
  AddEntityToDynamic3DCommand,
  SetParentForEntityCommand,
  UpdateSpatializedDynamic3DElementProperties,
} from './JSBCommand'
import { SpatialEntity } from './reality'
import { SpatializedElement } from './SpatializedElement'
import {
  SpatialEntityEventType,
  SpatialEntityOrReality,
  SpatializedElementProperties,
} from './types/types'

export class SpatializedDynamic3DElement extends SpatializedElement {
  children: SpatialEntityOrReality[] = []
  events: Record<string, (data: any) => void> = {}

  constructor(id: string) {
    super(id)
  }

  async addEntity(entity: SpatialEntity) {
    const ans = new SetParentForEntityCommand(entity.id, this.id).execute()
    this.children.push(entity)
    entity.parent = this
    return ans
  }

  addEvent(type: SpatialEntityEventType, callback: (data: any) => void) {
    this.events[type] = callback
  }

  removeEvent(eventName: SpatialEntityEventType) {
    if (this.events[eventName]) {
      delete this.events[eventName]
    }
  }

  dispatchEvent(evt: CustomEvent) {
    this.events[evt.type]?.(evt)
  }

  async updateProperties(properties: Partial<SpatializedElementProperties>) {
    return new UpdateSpatializedDynamic3DElementProperties(
      this,
      properties,
    ).execute()
  }
}

import { SpatialTransform, Vec3 } from '../../types/types'
import {
  AddComponentToEntityCommand,
  AddEntityToEntityCommand,
  RemoveEntityFromParentCommand,
  UpdateEntityPropertiesCommand,
} from '../../JSBCommand'
import { SpatialObject } from '../../SpatialObject'
import { SpatialEntityProperties } from '../../types/types'
import { SpatialComponent } from '../component/SpatialComponent'
import { SpatialWebEvent } from '../../SpatialWebEvent'

export class SpatialEntity extends SpatialObject {
  position: Vec3 = { x: 0, y: 0, z: 0 }
  rotation: Vec3 = { x: 0, y: 0, z: 0 }
  scale: Vec3 = { x: 1, y: 1, z: 1 }
  constructor(
    id: string,
    public name?: string,
  ) {
    super(id)
    SpatialWebEvent.addEventReceiver(id, this.onReceiveEvent)
  }

  async addComponent(component: SpatialComponent) {
    return new AddComponentToEntityCommand(this, component).execute()
  }
  async setPosition(position: Vec3) {
    return this.updateTransform({ position })
  }
  async setRotation(rotation: Vec3) {
    return this.updateTransform({ rotation })
  }
  async setScale(scale: Vec3) {
    return this.updateTransform({ scale })
  }

  async addEntity(ent: SpatialEntity) {
    return new AddEntityToEntityCommand(this, ent).execute()
  }
  async removeFromParent() {
    return new RemoveEntityFromParentCommand(this).execute()
  }
  async updateTransform(properties: Partial<SpatialEntityProperties>) {
    return new UpdateEntityPropertiesCommand(this, properties).execute()
  }
  private onReceiveEvent = (data: any) => {
    console.log('SpatialEntityEvent', data)
  }
  // onUpdate(properties: SpatialEntityProperties) {
  //   this.position = properties.position
  //   this.rotation = properties.rotation
  //   this.scale = properties.scale
  // }
}

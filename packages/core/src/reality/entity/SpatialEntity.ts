import {
  ConvertFromEntityToEntityCommand,
  ConvertFromEntityToSceneCommand,
} from './../../JSBCommand'
import { SpatialEntityEventType, Vec3 } from '../../types/types'
import {
  AddComponentToEntityCommand,
  AddEntityToEntityCommand,
  RemoveEntityFromParentCommand,
  UpdateEntityEventCommand,
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

  events: Record<string, (data: any) => void> = {}
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

  async addEvent(type: SpatialEntityEventType, callback: (data: any) => void) {
    if (this.events[type]) {
      // replace if exist
      this.events[type] = callback
    } else {
      try {
        await this.updateEntityEvent(type, true)
        this.events[type] = callback
      } catch (error) {
        console.error('addEvent failed', type)
      }
    }
  }

  async removeEvent(eventName: SpatialEntityEventType) {
    if (this.events[eventName]) {
      delete this.events[eventName]
      try {
        await this.updateEntityEvent(eventName, false)
      } catch (error) {
        console.error('removeEvent failed', eventName)
      }
    }
  }

  async updateEntityEvent(
    eventName: SpatialEntityEventType,
    isEnable: boolean,
  ) {
    return new UpdateEntityEventCommand(this, eventName, isEnable).execute()
  }
  private onReceiveEvent = (data: any) => {
    console.log('SpatialEntityEvent', data)
    const evt = new CustomEvent(data.type, data)
    // filter event
    if (this.events[data.type]) {
      this.events[data.type](evt)
    }
  }

  protected onDestroy(): void {
    SpatialWebEvent.removeEventReceiver(this.id)
  }
  // onUpdate(properties: SpatialEntityProperties) {
  //   this.position = properties.position
  //   this.rotation = properties.rotation
  //   this.scale = properties.scale
  // }
  async convertFromEntityToEntity(
    fromEntityId: string,
    toEntityId: string,
    position: Vec3,
  ) {
    return new ConvertFromEntityToEntityCommand(
      fromEntityId,
      toEntityId,
      position,
    ).execute()
  }

  async convertFromEntityToScene(fromEntityId: string, position: Vec3) {
    return new ConvertFromEntityToSceneCommand(fromEntityId, position).execute()
  }
}

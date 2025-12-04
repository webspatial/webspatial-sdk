import {
  ConvertFromEntityToEntityCommand,
  ConvertFromEntityToSceneCommand,
  ConvertFromSceneToEntityCommand,
  SetParentForEntityCommand,
} from './../../JSBCommand'
import {
  SpatialEntityEventType,
  SpatialEntityOrReality,
  SpatialEntityUserData,
  Vec3,
} from '../../types/types'
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
import { createSpatialEvent } from '../../SpatialWebEventCreator'
import {
  CubeInfoMsg,
  ObjectDestroyMsg,
  SpatialDragEndMsg,
  SpatialDragMsg,
  SpatialRotateEndMsg,
  SpatialRotateMsg,
  SpatialTapMsg,
  SpatialWebMsgType,
  TransformMsg,
} from '../../WebMsgCommand'

export class SpatialEntity extends SpatialObject {
  position: Vec3 = { x: 0, y: 0, z: 0 }
  rotation: Vec3 = { x: 0, y: 0, z: 0 }
  scale: Vec3 = { x: 1, y: 1, z: 1 }

  events: Record<string, (data: any) => void> = {}
  children: SpatialEntity[] = []
  parent: SpatialEntityOrReality | null = null
  constructor(
    id: string,
    public userData?: SpatialEntityUserData,
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
    const ans = await new SetParentForEntityCommand(ent.id, this.id).execute()
    this.children.push(ent)
    ent.parent = this
    return ans
  }
  async removeFromParent() {
    const ans = await new SetParentForEntityCommand(
      this.id,
      undefined,
    ).execute()
    if (this.parent) {
      this.parent.children = this.parent.children.filter(
        child => child.id !== this.id,
      )
      this.parent = null
    }
    return ans
  }

  async updateTransform(properties: Partial<SpatialEntityProperties>) {
    this.position = properties.position ?? this.position
    this.rotation = properties.rotation ?? this.rotation
    this.scale = properties.scale ?? this.scale
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
  private onReceiveEvent = (
    data: // | CubeInfoMsg
    // | TransformMsg
    | SpatialTapMsg
      // | SpatialDragMsg
      // | SpatialDragEndMsg
      // | SpatialRotateMsg
      // | SpatialRotateEndMsg
      | ObjectDestroyMsg,
  ) => {
    // console.log('SpatialEntityEvent', data)
    const { type } = data
    if (type === SpatialWebMsgType.objectdestroy) {
      this.isDestroyed = true
    } else if (type === SpatialWebMsgType.spatialtap) {
      const evt = createSpatialEvent(
        SpatialWebMsgType.spatialtap,
        (data as SpatialTapMsg).detail,
      )
      this.dispatchEvent(evt)
    } else if (type === SpatialWebMsgType.spatialdrag) {
      const evt = createSpatialEvent(
        SpatialWebMsgType.spatialdrag,
        (data as SpatialDragMsg).detail,
      )
      this.dispatchEvent(evt)
    } else if (type === SpatialWebMsgType.spatialdragend) {
      const evt = createSpatialEvent(
        SpatialWebMsgType.spatialdragend,
        (data as SpatialDragEndMsg).detail,
      )
      this.dispatchEvent(evt)
    }
  }

  dispatchEvent(evt: CustomEvent) {
    this.events[evt.type]?.(evt)
    if (evt.bubbles && !evt.cancelBubble) {
      if (this.parent && this.parent instanceof SpatialEntity) {
        this.parent.dispatchEvent(evt)
      }
    }
  }

  protected onDestroy(): void {
    SpatialWebEvent.removeEventReceiver(this.id)
    // handle children
    this.children.forEach(child => {
      child.parent = null
    })
    this.children = []
    // handle parent
    if (this.parent) {
      this.parent.children = this.parent.children.filter(
        child => child.id !== this.id,
      )
      this.parent = null
    }
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
  async convertFromSceneToEntity(entityId: string, position: Vec3) {
    return new ConvertFromSceneToEntityCommand(entityId, position).execute()
  }
}

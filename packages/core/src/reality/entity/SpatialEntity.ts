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
  SpatialMagnifyMsg,
  SpatialMagnifyEndMsg,
} from '../../WebMsgCommand'

export class SpatialEntity extends SpatialObject {
  position: Vec3 = { x: 0, y: 0, z: 0 }
  rotation: Vec3 = { x: 0, y: 0, z: 0 }
  scale: Vec3 = { x: 1, y: 1, z: 1 }

  events: Record<string, (data: any) => void> = {}
  children: SpatialEntity[] = []
  parent: SpatialEntityOrReality | null = null
  private _isDragging = false
  private _isRotating = false
  private _isMagnify = false
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
    data:
      | CubeInfoMsg
      | TransformMsg
      | SpatialTapMsg
      | SpatialDragMsg
      | SpatialDragEndMsg
      | SpatialRotateMsg
      | SpatialRotateEndMsg
      | SpatialMagnifyMsg
      | SpatialMagnifyEndMsg
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
      // todo: emulate event bubble on parent
      this.events[data.type]?.(evt)
    } else if (type === SpatialWebMsgType.spatialdrag) {
      if (!this._isDragging) {
        const dragStartEvent = createSpatialEvent(
          SpatialWebMsgType.spatialdragstart,
          (data as SpatialDragMsg).detail,
        )
        this.events[SpatialWebMsgType.spatialdragstart]?.(dragStartEvent)
      }
      this._isDragging = true
      const evt = createSpatialEvent(
        SpatialWebMsgType.spatialdrag,
        (data as SpatialDragMsg).detail,
      )
      this.events[SpatialWebMsgType.spatialdrag]?.(evt)
    } else if (type === SpatialWebMsgType.spatialdragend) {
      this._isDragging = false
      const evt = createSpatialEvent(
        SpatialWebMsgType.spatialdragend,
        (data as SpatialDragEndMsg).detail,
      )
      this.events[SpatialWebMsgType.spatialdragend]?.(evt)
    } else if (type === SpatialWebMsgType.spatialrotate) {
      if (!this._isRotating) {
        const rotateStartEvent = createSpatialEvent(
          SpatialWebMsgType.spatialrotatestart,
          (data as SpatialRotateMsg).detail,
        )
        this.events[SpatialWebMsgType.spatialrotatestart]?.(rotateStartEvent)
      }
      this._isRotating = true
      const evt = createSpatialEvent(
        SpatialWebMsgType.spatialrotate,
        (data as SpatialRotateMsg).detail,
      )
      this.events[SpatialWebMsgType.spatialrotate]?.(evt)
    } else if (type === SpatialWebMsgType.spatialrotateend) {
      this._isRotating = false
      const evt = createSpatialEvent(
        SpatialWebMsgType.spatialrotateend,
        (data as SpatialRotateEndMsg).detail,
      )
      this.events[SpatialWebMsgType.spatialrotateend]?.(evt)
    } else if (type === SpatialWebMsgType.spatialmagnify) {
      if (!this._isMagnify) {
        const magnifyStartEvent = createSpatialEvent(
          SpatialWebMsgType.spatialmagnifystart,
          (data as SpatialMagnifyMsg).detail,
        )
        this.events[SpatialWebMsgType.spatialmagnifystart]?.(magnifyStartEvent)
      }
      this._isMagnify = true
      const evt = createSpatialEvent(
        SpatialWebMsgType.spatialmagnify,
        (data as SpatialMagnifyMsg).detail,
      )
      this.events[SpatialWebMsgType.spatialmagnify]?.(evt)
    } else if (type === SpatialWebMsgType.spatialmagnifyend) {
      this._isMagnify = false
      const evt = createSpatialEvent(
        SpatialWebMsgType.spatialmagnifyend,
        (data as SpatialMagnifyEndMsg).detail,
      )
      this.events[SpatialWebMsgType.spatialmagnifyend]?.(evt)
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

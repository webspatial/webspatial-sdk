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
  RemoveComponentFromEntityCommand,
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
  ObjectDestroyMsg,
  SpatialDragEndMsg,
  SpatialDragMsg,
  SpatialDragStartMsg,
  SpatialMagnifyEndMsg,
  SpatialMagnifyMsg,
  SpatialRotateEndMsg,
  SpatialRotateMsg,
  SpatialTapMsg,
  SpatialWebMsgType,
} from '../../WebMsgCommand'

export class SpatialEntity extends SpatialObject {
  position: Vec3 = { x: 0, y: 0, z: 0 }
  rotation: Vec3 = { x: 0, y: 0, z: 0 }
  scale: Vec3 = { x: 1, y: 1, z: 1 }

  events: Record<string, (data: any) => void> = {}
  children: SpatialEntity[] = []
  parent: SpatialEntityOrReality | null = null
  private _enableInput: boolean = false

  get enableInput(): boolean {
    return this._enableInput
  }

  set enableInput(value: boolean) {
    // Why enabling only 'spatialtap' makes the entity interactive:
    // - On the native (Swift/RealityKit) side, SpatialEntity.updateGesture(type, isEnable)
    //   toggles per-gesture flags. Then enableInteractive = enableTap || enableRotate || enableDrag || enableMagnify.
    // - As soon as any gesture (e.g., 'spatialtap') is enabled, enableInteractive becomes true and
    //   InputTargetComponent is attached, making the entity targetable by targetedToAnyEntity().
    // - The view layer forwards hit gestures to the web, so enabling 'spatialtap' is sufficient to
    //   make the entity targetable; enable additional gestures only when needed.
    if (this._enableInput === value) return
    this._enableInput = value
    void this.updateEntityEvent('spatialtap', value).catch(err => {
      console.error('enableInput updateEntityEvent failed', 'spatialtap', err)
      // Roll back local flag if the native toggle fails to keep web/native states consistent.
      // Otherwise, the web side would think the entity is interactive while RealityKit is not.
      if (this._enableInput === value) {
        this._enableInput = !value
      }
    })
  }
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
  async removeComponent(component: SpatialComponent) {
    return new RemoveComponentFromEntityCommand(this, component).execute()
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
      | SpatialTapMsg
      | SpatialDragStartMsg
      | SpatialDragMsg
      | SpatialDragEndMsg
      | SpatialMagnifyMsg
      | SpatialMagnifyEndMsg
      | SpatialRotateMsg
      | SpatialRotateEndMsg
      | ObjectDestroyMsg,
  ) => {
    // console.log('SpatialEntityEvent', data)
    const { type } = data
    if (type === SpatialWebMsgType.objectdestroy) {
      this.isDestroyed = true
    }
    // tap
    else if (type === SpatialWebMsgType.spatialtap) {
      const evt = createSpatialEvent(SpatialWebMsgType.spatialtap, data.detail)
      this.dispatchEvent(evt)
    } else if (type === SpatialWebMsgType.spatialdragstart) {
      const evt = createSpatialEvent(
        SpatialWebMsgType.spatialdragstart,
        data.detail,
      )
      this.dispatchEvent(evt)
    } else if (type === SpatialWebMsgType.spatialdrag) {
      const evt = createSpatialEvent(SpatialWebMsgType.spatialdrag, data.detail)
      this.dispatchEvent(evt)
    } else if (type === SpatialWebMsgType.spatialdragend) {
      const evt = createSpatialEvent(
        SpatialWebMsgType.spatialdragend,
        data.detail,
      )
      this.dispatchEvent(evt)
    }
    // rotate
    else if (type === SpatialWebMsgType.spatialrotate) {
      const evt = createSpatialEvent(
        SpatialWebMsgType.spatialrotate,
        data.detail,
      )
      this.dispatchEvent(evt)
    } else if (type === SpatialWebMsgType.spatialrotateend) {
      const evt = createSpatialEvent(
        SpatialWebMsgType.spatialrotateend,
        data.detail,
      )
      this.dispatchEvent(evt)
    }
    // magnify
    else if (type === SpatialWebMsgType.spatialmagnify) {
      const evt = createSpatialEvent(
        SpatialWebMsgType.spatialmagnify,
        data.detail,
      )
      this.dispatchEvent(evt)
    } else if (type === SpatialWebMsgType.spatialmagnifyend) {
      const evt = createSpatialEvent(
        SpatialWebMsgType.spatialmagnifyend,
        data.detail,
      )
      this.dispatchEvent(evt)
    }
  }

  dispatchEvent(evt: CustomEvent) {
    // Set origin once at the first dispatch in the bubbling chain
    if (!(evt as any).__origin) {
      Object.defineProperty(evt, '__origin', { value: this, enumerable: false })
    }
    this.events[evt.type]?.(evt)
    if (evt.bubbles && !evt.cancelBubble) {
      if (this.parent) {
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

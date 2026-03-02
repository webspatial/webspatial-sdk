import { SpatialObjectProtocol } from '../types/types'
import { EventEmitter } from '../EventEmitter'

// Weak reference manager
export class SpatialObjectWeakRefManager {
  private static weakRefObjects: Record<string, { value: any }> = {}

  static getWeakRefCount(): number {
    return Object.keys(this.weakRefObjects).length
  }
  static setWeakRef(id: string, object: any): void {
    this.weakRefObjects[id] = { value: object }
  }

  static getWeakRef(id: string): any | null {
    return this.weakRefObjects[id]?.value || null
  }

  static removeWeakRef(id: string): void {
    delete this.weakRefObjects[id]
  }
}

// Spatial object base class
export class SpatialObject
  extends EventEmitter
  implements SpatialObjectProtocol
{
  static objects: Record<string, SpatialObjectProtocol> = {}

  static get(id: string): SpatialObjectProtocol | null {
    return this.objects[id] || null
  }

  static getRefObject(id: string): SpatialObject | null {
    return SpatialObjectWeakRefManager.getWeakRef(id)
  }

  readonly spatialId: string
  name: string = ''
  readonly id: string
  private _isDestroyed: boolean = false

  get isDestroyed(): boolean {
    return this._isDestroyed
  }

  constructor(id?: string) {
    super()
    this.spatialId = id || this.generateUUID()
    this.id = this.spatialId
    SpatialObject.objects[this.spatialId] = this
    SpatialObjectWeakRefManager.setWeakRef(this.spatialId, this)
  }

  destroy(): void {
    if (this._isDestroyed) {
      console.warn(`SpatialObject already destroyed ${this}`)
      return
    }
    this.emit('SpatialObject::BeforeDestroyed', { object: this })
    this.onDestroy()
    this._isDestroyed = true
    this.emit('SpatialObject::Destroyed', { object: this })
    delete SpatialObject.objects[this.spatialId]
    SpatialObjectWeakRefManager.removeWeakRef(this.spatialId)
    this.listeners = {}
  }

  protected onDestroy(): void {
    // Subclasses can override this method
  }

  private generateUUID(): string {
    // Simple UUID generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      },
    )
  }

  // Simplified equality method
  equals(other: SpatialObject): boolean {
    return this.spatialId === other.spatialId
  }
}

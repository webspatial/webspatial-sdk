import {
  ModelDragEvent,
  SpatialEntity,
  SpatialModel3DComponent,
} from '@webspatial/core-sdk'
import { getSession } from '../../utils'
import { SpatialTransformType } from './types'
import { getAbsoluteURL } from './utils'
import { parseTransformOrigin } from '../SpatialReactComponent/utils'
import { RectType } from '../types'

export class Model3DNative {
  constructor(parentEntity?: SpatialEntity) {
    this.parentEntity = parentEntity
  }

  private parentEntity?: SpatialEntity
  private initPromise?: Promise<any>
  private entity?: SpatialEntity
  private spatialModel3DComponent?: SpatialModel3DComponent

  // private modelUrl: string

  private isDestroyed = false

  private _onDragStart?: (dragEvent: ModelDragEvent) => void
  private _onDrag?: (dragEvent: ModelDragEvent) => void
  private _onDragEnd?: (dragEvent: ModelDragEvent) => void

  private _onTap?: () => void
  private _onDoubleTap?: () => void
  private _onLongPress?: () => void

  async init(
    modelUrl: string,
    onSuccess: () => void,
    onFailure: (error: string) => void,
  ) {
    if (this.isDestroyed) {
      return
    }

    this.initPromise = this.initInternal(modelUrl, onSuccess, onFailure)

    return this.initPromise
  }

  private async initInternal(
    modelUrl: string,
    onSuccess: () => void,
    onFailure: (error: string) => void,
  ) {
    if (__WEB__) return
    var session = getSession()

    if (!session) {
      return
    }

    // Create entity with view component to display the model inside
    const entity = await session.createEntity()
    await entity.setCoordinateSpace('Dom')

    const spatialModel3DComponent = await session.createModel3DComponent({
      url: getAbsoluteURL(modelUrl),
    })

    await entity.setComponent(spatialModel3DComponent)
    if (this.isDestroyed) {
      return
    }
    if (this.parentEntity) {
      await entity.setParent(this.parentEntity)
    } else {
      // Add entity to the window
      var wc = session.getCurrentWindowComponent()
      var ent = await wc.getEntity()
      await entity.setParent(ent!)
    }

    this.entity = entity
    this.spatialModel3DComponent = spatialModel3DComponent

    this.spatialModel3DComponent.onSuccess = onSuccess
    this.spatialModel3DComponent.onFailure = onFailure
    this.spatialModel3DComponent.onDragStart = this._onDragStart
    this.spatialModel3DComponent.onDrag = this._onDrag
    this.spatialModel3DComponent.onDragEnd = this._onDragEnd
    this.spatialModel3DComponent.onTap = this._onTap
    this.spatialModel3DComponent.onDoubleTap = this._onDoubleTap
    this.spatialModel3DComponent.onLongPress = this._onLongPress
  }

  async setVisible(visible: boolean) {
    if (this.entity) {
      await this.entity.setVisible(visible)
    }
  }

  async setContentMode(contentMode: 'fill' | 'fit') {
    if (this.spatialModel3DComponent) {
      await this.spatialModel3DComponent.setContentMode(contentMode)
    }
  }

  async setResizable(resizable: boolean) {
    if (this.spatialModel3DComponent) {
      await this.spatialModel3DComponent.setResizable(resizable)
    }
  }

  async setAspectRatio(aspectRatio: number) {
    if (this.spatialModel3DComponent) {
      await this.spatialModel3DComponent.setAspectRatio(aspectRatio)
    }
  }

  async updateByDom(
    dom: HTMLDivElement,
    options: { spatialTransform: SpatialTransformType },
  ) {
    if (!this.entity || !this.spatialModel3DComponent) {
      return
    }

    const rect = dom.getBoundingClientRect()
    const targetPosX = rect.left + (rect.right - rect.left) / 2
    const targetPosY =
      rect.bottom + (rect.top - rect.bottom) / 2 + window.scrollY
    const { spatialTransform } = options
    const { position, rotation, scale } = spatialTransform

    const entity = this.entity
    entity.transform.position.x = targetPosX + position.x
    entity.transform.position.y = targetPosY + position.y
    entity.transform.position.z = position.z

    entity.transform.orientation.x = rotation.x
    entity.transform.orientation.y = rotation.y
    entity.transform.orientation.z = rotation.z
    entity.transform.orientation.w = rotation.w

    entity.transform.scale.x = scale.x
    entity.transform.scale.y = scale.y
    entity.transform.scale.z = scale.z

    await entity.updateTransform()

    const spatialModel3DComponent = this.spatialModel3DComponent
    await spatialModel3DComponent.setResolution(rect.width, rect.height)

    const computedStyle = getComputedStyle(dom)
    const opacity = parseFloat(computedStyle.getPropertyValue('opacity'))
    await spatialModel3DComponent.setOpacity(opacity)

    const anchor = parseTransformOrigin(computedStyle)
    await spatialModel3DComponent.setRotationAnchor(anchor)
  }

  async updateRectAndTransform(
    rect: RectType,
    spatialTransform: SpatialTransformType,
  ) {
    if (!this.entity || !this.spatialModel3DComponent) {
      return
    }
    const targetPosX = rect.x + (rect.width - rect.x) / 2
    const targetPosY = rect.y + (rect.height - rect.y) / 2 + window.scrollY
    const { position, rotation, scale } = spatialTransform
    const entity = this.entity
    entity.transform.position.x = targetPosX + position.x
    entity.transform.position.y = targetPosY + position.y
    entity.transform.position.z = position.z
    entity.transform.orientation.x = rotation.x
    entity.transform.orientation.y = rotation.y
    entity.transform.orientation.z = rotation.z
    entity.transform.orientation.w = rotation.w
    entity.transform.scale.x = scale.x
    entity.transform.scale.y = scale.y
    entity.transform.scale.z = scale.z
    await entity.updateTransform()
    const spatialModel3DComponent = this.spatialModel3DComponent
    await spatialModel3DComponent.setResolution(rect.width, rect.height)
  }

  async setRotationAnchor(anchor: { x: number; y: number; z: number }) {
    if (this.spatialModel3DComponent) {
      await this.spatialModel3DComponent.setRotationAnchor(anchor)
    }
  }

  async setOpacity(opacity: number) {
    if (this.spatialModel3DComponent) {
      this.spatialModel3DComponent.setOpacity(opacity)
    }
  }

  public set onDragStart(
    callback: ((dragEvent: ModelDragEvent) => void) | undefined,
  ) {
    if (this.spatialModel3DComponent) {
      this.spatialModel3DComponent.onDragStart = callback
    }
    this._onDragStart = callback
  }

  public set onDrag(
    callback: ((dragEvent: ModelDragEvent) => void) | undefined,
  ) {
    if (this.spatialModel3DComponent) {
      this.spatialModel3DComponent.onDrag = callback
    }
    this._onDrag = callback
  }

  public set onDragEnd(
    callback: ((dragEvent: ModelDragEvent) => void) | undefined,
  ) {
    if (this.spatialModel3DComponent) {
      this.spatialModel3DComponent.onDragEnd = callback
    }
    this._onDragEnd = callback
  }

  public set onTap(callback: (() => void) | undefined) {
    if (this.spatialModel3DComponent) {
      this.spatialModel3DComponent.onTap = callback
    }
    this._onTap = callback
  }

  public set onDoubleTap(callback: (() => void) | undefined) {
    if (this.spatialModel3DComponent) {
      this.spatialModel3DComponent.onDoubleTap = callback
    }
    this._onDoubleTap = callback
  }
  public set onLongPress(callback: (() => void) | undefined) {
    if (this.spatialModel3DComponent) {
      this.spatialModel3DComponent.onLongPress = callback
    }
    this._onLongPress = callback
  }

  /**
   * Destroys the current 3D model instance
   * 1. Marks the instance as destroyed
   * 2. Waits for initialization to complete (if in progress)
   * 3. Destroys the spatial entity
   * 4. Cleans up all related references
   */
  async destroy() {
    this.isDestroyed = true
    if (this.initPromise) {
      await this.initPromise
    }
    this.entity?.destroy()
    this.entity = undefined
    this.spatialModel3DComponent = undefined
    this.initPromise = undefined
  }
}

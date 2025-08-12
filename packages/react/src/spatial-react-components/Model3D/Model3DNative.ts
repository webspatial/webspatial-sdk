import {
  // SpatialModelDragEvent,
  Spatialized2DElement,
  SpatializedStatic3DElement,
} from '@webspatial/core-sdk'
import { getSession } from '../../utils'
import { SpatialTransformType } from './types'
import { getAbsoluteURL } from './utils'
import { parseTransformOrigin } from '../SpatialReactComponent/utils'
import { RectType } from '../types'

class SpatialModelDragEvent {}

export class Model3DNative {
  constructor(parentEntity?: Spatialized2DElement) {
    this.parentEntity = parentEntity
  }

  private parentEntity?: Spatialized2DElement
  private initPromise?: Promise<any>
  private spatialObject?: SpatializedStatic3DElement

  // private modelUrl: string

  private isDestroyed = false

  // private _onDragStart?: (dragEvent: SpatialModelDragEvent) => void
  // private _onDrag?: (dragEvent: SpatialModelDragEvent) => void
  // private _onDragEnd?: (dragEvent: SpatialModelDragEvent) => void

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
    var session = getSession()

    if (!session) {
      return
    }

    // Create entity with view component to display the model inside
    const spatialObject = await session.createSpatializedStatic3DElement(
      getAbsoluteURL(modelUrl),
    )
    if (this.isDestroyed) {
      return
    }
    if (this.parentEntity) {
      await this.parentEntity.addSpatializedElement(spatialObject)
    } else {
      // Add spatialObject to the spatialObject
      var spatialScene = session.getSpatialScene()
      await spatialScene.addSpatializedElement(spatialObject)
    }

    this.spatialObject = spatialObject

    // this.spatialModel3DComponent.onSuccess = onSuccess
    // this.spatialModel3DComponent.onFailure = onFailure
    // this.spatialModel3DComponent.onDragStart = this._onDragStart
    // this.spatialModel3DComponent.onDrag = this._onDrag
    // this.spatialModel3DComponent.onDragEnd = this._onDragEnd
    // this.spatialModel3DComponent.onTap = this._onTap
    // this.spatialModel3DComponent.onDoubleTap = this._onDoubleTap
    // this.spatialModel3DComponent.onLongPress = this._onLongPress
  }

  async setVisible(visible: boolean) {
    this.spatialObject?.updateProperties({ visible })
  }

  async setContentMode(contentMode: 'fill' | 'fit') {
    // will delete
  }

  async setResizable(resizable: boolean) {
    // will delete
  }

  async setAspectRatio(aspectRatio: number) {
    // will delete
  }

  async updateByDom(
    dom: HTMLDivElement,
    options: { spatialTransform: SpatialTransformType },
  ) {
    if (!this.spatialObject) {
      return
    }

    const computedStyle = getComputedStyle(dom)

    const isFixed = computedStyle.position === 'fixed'
    const scrollY = isFixed ? 0 : window.scrollY

    const rect = dom.getBoundingClientRect()

    const { spatialTransform } = options
    const { position, rotation, scale } = spatialTransform

    const spatialObject = this.spatialObject
    await spatialObject.updateTransform({
      position: {
        x: rect.left + position.x,
        y: rect.top + position.y + scrollY,
        z: position.z,
      },
      quaternion: {
        x: rotation.x,
        y: rotation.y,
        z: rotation.z,
        w: rotation.w,
      },
      scale: {
        x: scale.x,
        y: scale.y,
        z: scale.z,
      },
    })

    const rotationAnchor = parseTransformOrigin(computedStyle)

    await spatialObject.updateProperties({
      width: rect.width,
      height: rect.height,
      opacity: parseFloat(computedStyle.getPropertyValue('opacity')),
      rotationAnchor,
    })

    await this.setScrollWithParent(!isFixed)
  }

  async updateRectAndTransform(
    rect: RectType,
    spatialTransform: SpatialTransformType,
  ) {
    console.log('updateRectAndTransform', rect, spatialTransform, this.spatialObject)
    if (!this.spatialObject) {
      return
    }

    const { position, rotation, scale } = spatialTransform
    const spatialObject = this.spatialObject
    await spatialObject.updateTransform({
      position: {
        x: rect.x + position.x,
        y: rect.y + position.y + scrollY,
        z: position.z,
      },
      quaternion: {
        x: rotation.x,
        y: rotation.y,
        z: rotation.z,
        w: rotation.w,
      },
      scale: {
        x: scale.x,
        y: scale.y,
        z: scale.z,
      },
    })

    await spatialObject.updateProperties({
      width: rect.width,
      height: rect.height,
    })
  }

  async setRotationAnchor(anchor: { x: number; y: number; z: number }) {
    this.spatialObject?.updateProperties({ rotationAnchor: anchor })
  }

  async setOpacity(opacity: number) {
    this.spatialObject?.updateProperties({ opacity })
  }

  async setScrollWithParent(scrollWithParent: boolean) {
    this.spatialObject?.updateProperties({ scrollWithParent })
  }

  async changeParentEntity(parentEntity?: Spatialized2DElement) {
    var session = getSession()

    if (!session) {
      return
    }

    if (this.parentEntity !== parentEntity) {
      this.parentEntity = parentEntity

      if (this.spatialObject) {
        if (this.parentEntity) {
          await this.parentEntity.addSpatializedElement(this.spatialObject)
        } else {
          // Add spatialObject to the spatialObject
          var spatialScene = session.getSpatialScene()
          await spatialScene.addSpatializedElement(this.spatialObject)
        }
      }
    }
  }

  public set onDragStart(
    callback: ((dragEvent: SpatialModelDragEvent) => void) | undefined,
  ) {
    // if (this.spatialModel3DComponent) {
    //   this.spatialModel3DComponent.onDragStart = callback
    // }
    // this._onDragStart = callback
  }

  public set onDrag(
    callback: ((dragEvent: SpatialModelDragEvent) => void) | undefined,
  ) {
    // if (this.spatialModel3DComponent) {
    //   this.spatialModel3DComponent.onDrag = callback
    // }
    // this._onDrag = callback
  }

  public set onDragEnd(
    callback: ((dragEvent: SpatialModelDragEvent) => void) | undefined,
  ) {
    // if (this.spatialModel3DComponent) {
    //   this.spatialModel3DComponent.onDragEnd = callback
    // }
    // this._onDragEnd = callback
  }

  public set onTap(callback: (() => void) | undefined) {
    // if (this.spatialModel3DComponent) {
    //   this.spatialModel3DComponent.onTap = callback
    // }
    this._onTap = callback
  }

  public set onDoubleTap(callback: (() => void) | undefined) {
    // if (this.spatialModel3DComponent) {
    //   this.spatialModel3DComponent.onDoubleTap = callback
    // }
    this._onDoubleTap = callback
  }
  public set onLongPress(callback: (() => void) | undefined) {
    // if (this.spatialModel3DComponent) {
    //   this.spatialModel3DComponent.onLongPress = callback
    // }
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
    this.spatialObject?.destroy()
    this.spatialObject = undefined
    this.initPromise = undefined
  }
}

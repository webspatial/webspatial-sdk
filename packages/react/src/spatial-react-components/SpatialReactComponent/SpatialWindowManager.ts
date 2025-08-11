import {
  Spatialized2DElement,
  Spatialized2DElementProperties,
} from '@webspatial/core-sdk'
import { getSession } from '../../utils'
import { vecType, quatType, RectType } from '../types'

// Manager classes to handle resource creation/deletion
export class SpatialWindowManager {
  initPromise?: Promise<any>
  get window() {
    return this.spatialized2DElement?.windowProxy
  }

  spatialized2DElement: Spatialized2DElement | null = null

  private parentSpatialWindowManager?: SpatialWindowManager
  private isFixedPosition: boolean

  constructor(options: {
    parentSpatialWindowManager?: SpatialWindowManager
    isFixedPosition?: boolean
  }) {
    this.isFixedPosition = options.isFixedPosition || false
    this.parentSpatialWindowManager = options.parentSpatialWindowManager
  }

  setDebugName(debugName: string) {
    // this.entity?._setName(debugName)
    this.spatialized2DElement?.updateProperties({
      name: debugName,
    })
  }

  // private async initInternal(url: string) {
  //   console.log('dbg initInternal', url)
  //   // this.entity = await getSession()!.createEntity()
  //   // this.webview = await getSession()!.createWindowComponent()
  //   // await this.webview.loadURL(url)
  //   // await this.entity.setCoordinateSpace('Dom')
  //   // await this.webview.setScrollWithParent(true)
  //   // await this.webview.setScrollEnabled(false)
  //   // await this.entity.setComponent(this.webview)

  //   // var wc = await getSession()!.getCurrentWindowComponent()
  //   // var ent = await wc.getEntity()
  //   // await this.entity.setParent(ent!)
  // }

  private async initInternalFromWindow() {
    this.spatialized2DElement = await getSession()!.createSpatialized2DElement()
    this.setEntityParentByCSSPosition(this.isFixedPosition)
  }

  async updateCSSPosition(isFixedPosition: boolean) {
    if (this.isFixedPosition === isFixedPosition) {
      return
    } else {
      this.isFixedPosition = isFixedPosition
    }
    return this.setEntityParentByCSSPosition(isFixedPosition)
  }

  async updateProperties(properties: Partial<Spatialized2DElementProperties>) {
    this.spatialized2DElement?.updateProperties(properties)
  }

  private async setEntityParentByCSSPosition(isFixedPosition: boolean) {
    if (this.initPromise) {
      await this.initPromise
      if (isFixedPosition || !this.parentSpatialWindowManager) {
        // Add as a child of the current page
        var spatialScene = await getSession()!.getSpatialScene()
        await spatialScene.addSpatializedElement(this.spatialized2DElement!)
      } else {
        const parentSpatialWindowManager = this.parentSpatialWindowManager!
        // Add as a child of the parent
        await parentSpatialWindowManager.initPromise
        parentSpatialWindowManager.spatialized2DElement?.addSpatializedElement(
          this.spatialized2DElement!,
        )
      }
    }
  }

  async initFromWidow() {
    this.initPromise = this.initInternalFromWindow()
    await this.initPromise
  }
  async resize(
    rect: RectType,
    position: vecType,
    rotation: quatType = { x: 0, y: 0, z: 0, w: 1 },
    scale: vecType = { x: 1, y: 1, z: 1 },
    rotationOrigin: vecType = { x: 0, y: 0, z: 0 },
    parrentOffset: number = 0,
  ) {
    if (!this.spatialized2DElement) {
      return
    }

    const spatialized2DElement = this.spatialized2DElement!
    await spatialized2DElement.updateTransform({
      position: {
        x: rect.x + position.x,
        y: rect.y + position.y + parrentOffset,
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

    await spatialized2DElement.updateProperties({
      width: rect.width,
      height: rect.height,
      rotationAnchor: rotationOrigin,
    })
  }

  async setZIndex(zIndex: number) {
    if (!this.spatialized2DElement) {
      return
    }

    const spatialized2DElement = this.spatialized2DElement!
    await spatialized2DElement.updateProperties({
      zIndex,
    })
  }

  async destroy() {
    if (this.initPromise) {
      await this.initPromise
      this.spatialized2DElement?.destroy()
      this.spatialized2DElement = null
    }
  }
}

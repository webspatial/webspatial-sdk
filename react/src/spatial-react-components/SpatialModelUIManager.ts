import { SpatialEntity, SpatialViewComponent } from '@xrsdk/runtime'
import { getSession } from '../utils'
import { vecType } from './types'

export class SpatialModelUIManager {
  initPromise?: Promise<any>
  entity?: SpatialEntity
  viewComponent?: SpatialViewComponent

  async initInternal(url: string) {
    var session = getSession()!

    // Create entity with view component to display the model inside
    this.entity = await session.createEntity()
    this.entity.setCoordinateSpace('Dom')
    this.viewComponent = await session.createViewComponent()
    await this.entity.setComponent(this.viewComponent)

    // Add model within the view based on bounding box
    var e = await session.createEntity()
    var model = await session.createModelComponent({ url: url })
    await e.setComponent(model)
    var bb = await e.getBoundingBox()

    // Scale to fit
    var scale = 1 / Math.max(bb.extents.x, bb.extents.y, bb.extents.z)
    e.transform.scale.x = scale
    e.transform.scale.y = scale
    e.transform.scale.z = scale

    // Center within view
    e.transform.position.x = -bb.center.x * scale
    e.transform.position.y = -bb.center.y * scale
    e.transform.position.z = -bb.center.z * scale
    await e.updateTransform()
    await e.setParent(this.entity)

    // Add entity to the window
    var wc = session.getCurrentWindowComponent()
    var ent = await wc.getEntity()
    await this.entity.setParent(ent!)
  }
  async init(url: string) {
    this.initPromise = this.initInternal(url)
    await this.initPromise
  }
  async resize(element: HTMLElement, offset: vecType) {
    let rect = element.getBoundingClientRect()
    let targetPosX = rect.left + (rect.right - rect.left) / 2
    let targetPosY = rect.bottom + (rect.top - rect.bottom) / 2 + window.scrollY
    if (!this.viewComponent) {
      return
    }
    var entity = this.entity!
    entity.transform.position.x = targetPosX + offset.x
    entity.transform.position.y = targetPosY + offset.y
    entity.transform.position.z = offset.z
    await entity.updateTransform()

    var viewComponent = this.viewComponent!
    await viewComponent.setResolution(rect.width, rect.height)
  }

  async setOpacity(opacity: number) {
    if (!this.viewComponent) {
      return
    }
  }

  async destroy() {
    if (this.initPromise) {
      await this.initPromise
      this.entity?.destroy()
      this.viewComponent?.destroy()
    }
  }
}

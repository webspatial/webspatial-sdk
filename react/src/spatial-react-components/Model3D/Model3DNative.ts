import { SpatialEntity, SpatialModel3DComponent } from '@xrsdk/runtime'
import { getSession } from '../../utils'
import { SpatialTransformType } from './types'
import { getAbsoluteURL } from './utils'
import { parseTransformOrigin } from '../SpatialReactComponent/utils'

export class Model3DNative {
  private initPromise?: Promise<any>
  private entity?: SpatialEntity
  private spatialModel3DComponent?: SpatialModel3DComponent

  // private modelUrl: string

  private isDestroyed = false

  async init(modelUrl: string) {
    if (this.isDestroyed) {
      return
    }

    this.initPromise = this.initInternal(modelUrl)
    return this.initPromise
  }

  private async initInternal(modelUrl: string) {
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
    // Add entity to the window
    var wc = session.getCurrentWindowComponent()
    var ent = await wc.getEntity()
    await entity.setParent(ent!)

    this.entity = entity
    this.spatialModel3DComponent = spatialModel3DComponent
  }

  async setVisible(visible: boolean) {
    if (this.entity) {
      await this.entity.setVisible(visible)
    }
  }

  async setContentMode(contentMode: 'fill' | 'fit') {
    if (this.spatialModel3DComponent) {
      await this.spatialModel3DComponent.setAspectRatio(contentMode)
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

  async setOpacity(opacity: number) {
    if (this.spatialModel3DComponent) {
      this.spatialModel3DComponent.setOpacity(opacity)
    }
  }

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

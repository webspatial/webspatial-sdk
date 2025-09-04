import { Spatialized2DElement, SpatializedElement } from '@webspatial/core-sdk'
import { createContext } from 'react'
import { SpatializedContainerObject } from './SpatializedContainerContext'
import { parseTransformOrigin } from '../utils'
import { SpatialCustomStyleVars } from '../types'
import { getSession } from '../../utils'
import { Matrix4, Quaternion, Vector3 } from '../../utils/math'

type DomRect = {
  x: number
  y: number
  width: number
  height: number
}

type CachedDomInfo = {
  // point to 2DFrame dom in StandardInstanceContainer
  dom: HTMLElement
  computedStyle: CSSStyleDeclaration
  isFixedPosition: boolean
}

type CachedTransformVisibilityInfo = {
  visibility: string
  transformMatrix: Matrix4
}

export class PortalInstanceObject {
  readonly spatialId: string
  readonly spatializedContainerObject: SpatializedContainerObject
  readonly parentPortalInstanceObject: PortalInstanceObject | null
  spatializedElement?: SpatializedElement

  // cachedDomInfo used for cache dom info
  // when dom is updated, this property should be updated as well
  private cachedDomInfo?: CachedDomInfo

  get dom(): HTMLElement | undefined {
    return this.cachedDomInfo?.dom
  }

  get computedStyle(): CSSStyleDeclaration | undefined {
    return this.cachedDomInfo?.computedStyle
  }

  get isFixedPosition(): boolean | undefined {
    return this.cachedDomInfo?.isFixedPosition
  }

  // cachedDomRect used for cache dom rect
  private cachedDomRect?: DomRect
  get domRect(): DomRect | undefined {
    return this.cachedDomRect
  }

  // cachedTransformVisibilityInfo used for cache transform visibility info
  private cachedTransformVisibilityInfo?: CachedTransformVisibilityInfo
  get transformMatrix() {
    return this.cachedTransformVisibilityInfo?.transformMatrix
  }
  get visibility() {
    return this.cachedTransformVisibilityInfo?.visibility
  }

  // spatializedElementPromise used for get spatialized element
  // SpatializedElement is when attachSpatializedElement is called
  private spatializedElementPromise?: Promise<SpatializedElement>
  private spatializedElementResolver?: (
    spatializedElement: SpatializedElement,
  ) => void

  // used for get extra spatialized element properties
  private getExtraSpatializedElementProperties?: (
    computedStyle: CSSStyleDeclaration,
  ) => Record<string, string | number>

  constructor(
    spatialId: string,
    spatializedContainerObject: SpatializedContainerObject,
    parentPortalInstanceObject: PortalInstanceObject | null,
    getExtraSpatializedElementProperties?: (
      computedStyle: CSSStyleDeclaration,
    ) => Record<string, string>,
  ) {
    this.spatialId = spatialId
    this.spatializedContainerObject = spatializedContainerObject
    this.parentPortalInstanceObject = parentPortalInstanceObject
    this.getExtraSpatializedElementProperties =
      getExtraSpatializedElementProperties

    this.spatializedElementPromise = new Promise<SpatializedElement>(
      resolve => {
        this.spatializedElementResolver = resolve
      },
    )

    spatializedContainerObject.onSpatialTransformVisibilityChange(
      spatialId,
      spatialTransform => {
        this.cachedTransformVisibilityInfo = spatialTransform
        this.updateSpatializedElementProperties()
      },
    )
  }

  // called when 2D frame change
  notify2DFrameChange() {
    console.log('notify2DFrameChange')

    const dom = this.spatializedContainerObject.querySpatialDomBySpatialId(
      this.spatialId,
    )
    if (!dom) {
      console.log('dom not exist!')
      return
    }
    const computedStyle = getComputedStyle(dom)
    this.cachedDomInfo = {
      dom,
      computedStyle,
      isFixedPosition: computedStyle.getPropertyValue('position') === 'fixed',
    }

    this.updateSpatializedElementProperties()
  }

  private async getSpatializedElement() {
    return this.spatializedElementPromise
  }

  // called when SpatializedElement is created
  attachSpatializedElement(spatializedElement: SpatializedElement) {
    console.log('attachSpatializedElement', spatializedElement)
    this.spatializedElement = spatializedElement
    // attach to spatializedContainerObject
    this.addToParent(spatializedElement)
    this.spatializedElementResolver?.(spatializedElement)

    this.updateSpatializedElementProperties()
  }

  private inAddingToParent: boolean = false

  private async addToParent(spatializedElement: SpatializedElement) {
    if (this.inAddingToParent) {
      return
    }
    this.inAddingToParent = true

    if (this.isFixedPosition || !this.parentPortalInstanceObject) {
      // Add as a child of the current page
      var spatialScene = await getSession()!.getSpatialScene()
      await spatialScene.addSpatializedElement(spatializedElement!)
    } else {
      const parentSpatialized2DElement =
        (await this.parentPortalInstanceObject.getSpatializedElement()) as Spatialized2DElement
      // Add as a child of the parent
      parentSpatialized2DElement.addSpatializedElement(spatializedElement!)
    }
    this.inAddingToParent = false
  }

  private updateSpatializedElementProperties() {
    console.log('updateSpatializedElement', this.spatializedElement)
    // read from spatializedContainerContext
    const dom = this.dom
    const spatializedElement = this.spatializedElement
    const visibility = this.visibility
    if (!dom || !spatializedElement || !visibility || !this.transformMatrix) {
      console.log(
        `not ready to  updateSpatializedElementProperties! dom is ${!!dom} spatializedElement is ${spatializedElement} visibility is ${visibility}`,
      )
      return
    }

    const computedStyle = this.computedStyle!
    const isFixedPosition = this.isFixedPosition!

    let domRect = dom.getBoundingClientRect()

    let { x, y } = domRect
    if (!isFixedPosition) {
      const parentDom =
        this.spatializedContainerObject.queryParentSpatialDomBySpatialId(
          this.spatialId,
        )
      if (parentDom) {
        const parentDomRect = parentDom.getBoundingClientRect()
        x -= parentDomRect.x
        y -= parentDomRect.y
      }
    }

    // update cachedDomRect
    this.cachedDomRect = {
      x: domRect.x,
      y: domRect.y,
      width: domRect.width,
      height: domRect.height,
    }

    console.log('updateSpatializedElementProperties', domRect)

    const width = domRect.width
    const height = domRect.height
    const opacity = parseFloat(computedStyle.getPropertyValue('opacity'))
    const scrollWithParent = !isFixedPosition
    const contentVisibility =
      computedStyle.getPropertyValue('content-visibility')
    const display = computedStyle.getPropertyValue('display')
    const visible =
      visibility === 'visible' &&
      contentVisibility !== 'hidden' &&
      display !== 'none'

    const zIndex =
      parseFloat(
        computedStyle.getPropertyValue(SpatialCustomStyleVars.xrZIndex),
      ) || 0
    const backOffset =
      parseFloat(computedStyle.getPropertyValue(SpatialCustomStyleVars.back)) ||
      0
    const rotationAnchor = parseTransformOrigin(computedStyle)
    const extraProperties =
      this.getExtraSpatializedElementProperties?.(computedStyle) || {}

    spatializedElement.updateProperties({
      width,
      height,
      opacity,
      scrollWithParent,
      zIndex,
      visible,
      backOffset,
      rotationAnchor,
      ...extraProperties,
    })

    // update transform
    const transform = this.transformMatrix!
    const position = new Vector3()
    const quaternion = new Quaternion()
    const scale = new Vector3()
    transform.decompose(position, quaternion, scale)

    const parentWindow = this.parentPortalInstanceObject
      ? (
          this.parentPortalInstanceObject
            .spatializedElement! as Spatialized2DElement
        ).windowProxy
      : window
    const parrentOffsetX: number = parentWindow.scrollX
    const parrentOffsetY: number = parentWindow.scrollY
    spatializedElement.updateTransform({
      position: {
        x: x + position.x + parrentOffsetX,
        y: y + position.y + parrentOffsetY,
        z: position.z + backOffset,
      },
      quaternion: {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w,
      },
      scale: {
        x: scale.x,
        y: scale.y,
        z: scale.z,
      },
    })
  }
}

export const PortalInstanceContext = createContext<PortalInstanceObject | null>(
  null,
)

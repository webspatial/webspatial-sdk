import { Spatialized2DElement, SpatializedElement } from '@webspatial/core-sdk'
import { createContext } from 'react'
import { SpatializedContainerObject } from './SpatializedContainerContext'
import { parseTransformOrigin } from '../utils'
import { SpatialCustomStyleVars, SpatialTransformVisibility } from '../types'
import { getSession } from '../../utils'

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
  transformMatrix: DOMMatrix
}

export class PortalInstanceObject {
  readonly spatialId: string
  readonly spatializedContainerObject: SpatializedContainerObject
  readonly parentPortalInstanceObject: PortalInstanceObject | null
  spatializedElement?: SpatializedElement
  isFloatingOverlay = false

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
  }

  // called when PortalSpatializedContainer is mounted
  init() {
    this.spatializedContainerObject.onSpatialTransformVisibilityChange(
      this.spatialId,
      this.onSpatialTransformVisibilityChange,
    )
  }

  // called when PortalSpatializedContainer is unmounted
  destroy() {
    this.spatializedContainerObject.offSpatialTransformVisibilityChange(
      this.spatialId,
      this.onSpatialTransformVisibilityChange,
    )
    this.spatializedContainerObject.unregisterSpatialDom(this.spatialId)
  }

  setFloatingOverlay(enabled: boolean) {
    this.isFloatingOverlay = enabled
  }

  private onSpatialTransformVisibilityChange = (
    spatialTransform: SpatialTransformVisibility,
  ) => {
    this.cachedTransformVisibilityInfo = {
      transformMatrix: new DOMMatrix(spatialTransform.transform),
      visibility: spatialTransform.visibility,
    }
    this.updateSpatializedElementProperties()
  }

  // called when 2D frame change
  notify2DFrameChange() {
    const dom = this.spatializedContainerObject.querySpatialDomBySpatialId(
      this.spatialId,
    )
    if (!dom) {
      return
    }
    const computedStyle = getComputedStyle(dom)
    const isFixedPosition =
      !this.isFloatingOverlay &&
      computedStyle.getPropertyValue('position') === 'fixed'
    this.cachedDomInfo = {
      dom,
      computedStyle,
      isFixedPosition,
    }

    this.updateSpatializedElementProperties()

    const __innerSpatializedElement = () => this.spatializedElement

    Object.assign(dom, {
      __innerSpatializedElement,
    })
  }

  private async getSpatializedElement() {
    return this.spatializedElementPromise
  }

  // called when SpatializedElement is created
  attachSpatializedElement(spatializedElement: SpatializedElement) {
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

    if (
      (!this.isFloatingOverlay && this.isFixedPosition) ||
      !this.parentPortalInstanceObject
    ) {
      // Add as a child of the current page.
      // Floating overlays (Scenario 3) always have a parent portal, so they
      // skip this branch and attach to the parent below.
      const spatialScene = await getSession()!.getSpatialScene()
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
    // console.log('updateSpatializedElement', this.spatializedElement)
    // read from spatializedContainerContext
    const dom = this.dom
    const spatializedElement = this.spatializedElement
    const visibility = this.visibility
    // Overlay (Scenario 3): the measurement placeholder is intentionally
    // `visibility: hidden` in the parent window (the visible copy is the child
    // webview), and a nested overlay has no transform/visibility probe of its
    // own. So the watcher-driven `visibility`/`transformMatrix` may be absent or
    // report `hidden`. Native surface visibility must NOT be derived from the
    // hidden placeholder — overlay surfaces supply their own defaults below.
    if (
      !dom ||
      !spatializedElement ||
      (!this.isFloatingOverlay && (!visibility || !this.transformMatrix))
    ) {
      return
    }

    // Radix already encodes the popper position in the placeholder's rect (via
    // the fixed wrapper transform), so the overlay surface uses identity here.
    const transformMatrix = this.transformMatrix ?? new DOMMatrix()

    const computedStyle = this.computedStyle!
    const isFixedPosition = this.isFloatingOverlay
      ? false
      : this.isFixedPosition!

    let domRect = dom.getBoundingClientRect()

    let { x, y } = domRect
    // Overlay (Scenario 3): the placeholder host lives in the parent spatial
    // window, so its getBoundingClientRect is already in that window's viewport
    // coordinates, and the surface is attached as a child of the parent. Use the
    // raw rect directly — do not subtract a DOM ancestor or add host-page scroll.
    if (!this.isFloatingOverlay && !isFixedPosition) {
      const parentDom =
        this.spatializedContainerObject.queryParentSpatialDomBySpatialId(
          this.spatialId,
        )
      if (parentDom) {
        const parentDomRect = parentDom.getBoundingClientRect()
        x -= parentDomRect.x
        y -= parentDomRect.y
      } else {
        // Adjust to get the page relative to document instead of viewport
        x += window.scrollX
        y += window.scrollY
      }
    }

    // update cachedDomRect
    this.cachedDomRect = {
      x: domRect.x,
      y: domRect.y,
      width: domRect.width,
      height: domRect.height,
    }

    // console.log('updateSpatializedElementProperties', domRect)

    const width = domRect.width
    const height = domRect.height
    const opacity = parseFloat(computedStyle.getPropertyValue('opacity'))
    const scrollWithParent = !isFixedPosition

    const display = computedStyle.getPropertyValue('display')
    // Overlay native visibility is decoupled from the hidden measurement
    // placeholder: show whenever it is laid out (`display !== 'none'`).
    const visible = this.isFloatingOverlay
      ? display !== 'none'
      : visibility === 'visible' && display !== 'none'

    const zIndex =
      parseFloat(
        computedStyle.getPropertyValue(SpatialCustomStyleVars.xrZIndex),
      ) || 0
    const backOffset =
      parseFloat(computedStyle.getPropertyValue(SpatialCustomStyleVars.back)) ||
      0

    const depth =
      parseFloat(
        computedStyle.getPropertyValue(SpatialCustomStyleVars.depth),
      ) || 0

    const rotationAnchor = parseTransformOrigin(computedStyle)
    const extraProperties =
      this.getExtraSpatializedElementProperties?.(computedStyle) || {}

    spatializedElement.updateProperties({
      clientX: x,
      clientY: y,
      width,
      height,
      depth,
      opacity,
      scrollWithParent,
      zIndex,
      visible,
      backOffset,
      rotationAnchor,
      ...extraProperties,
    })

    // update transform
    spatializedElement.updateTransform(transformMatrix)

    // assign spatializedElement to dom
    Object.assign(this.dom, {
      __spatializedElement: spatializedElement,
    })
  }
}

export const PortalInstanceContext = createContext<PortalInstanceObject | null>(
  null,
)

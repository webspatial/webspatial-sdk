import { Spatialized2DElement, SpatializedElement } from '@webspatial/core-sdk'
import { createContext } from 'react'
import { SpatializedContainerObject } from './SpatializedContainerContext'
import { parseTransformOrigin } from '../utils'
import { SpatialCustomStyleVars, SpatialTransformVisibility } from '../types'
import { getSession } from '../../utils'

/** Cached viewport-relative DOM bounds. */
type DomRect = {
  /** The viewport-relative x coordinate. */
  x: number
  /** The viewport-relative y coordinate. */
  y: number
  /** The measured width. */
  width: number
  /** The measured height. */
  height: number
}

/** Cached DOM metadata derived from the current bound element. */
type CachedDomInfo = {
  /** Points to the live 2D frame DOM node in the standard container tree. */
  dom: HTMLElement
  /** Stores the computed style snapshot used for portal sync. */
  computedStyle: CSSStyleDeclaration
  /** Indicates whether the DOM node uses fixed positioning. */
  isFixedPosition: boolean
}

/** Cached transform/visibility data received from the spatial container. */
type CachedTransformVisibilityInfo = {
  /** The current visibility string reported by the spatial container. */
  visibility: string
  /** The latest spatial transform matrix applied to the element. */
  transformMatrix: DOMMatrix
}

/**
 * Runtime portal instance that coordinates DOM measurements, spatial element
 * lifecycle and DOM-to-native sync for a single spatial node.
 */
export class PortalInstanceObject {
  /** Stable spatial id used to query DOM and container state. */
  readonly spatialId: string
  /** Owning spatialized container runtime object. */
  readonly spatializedContainerObject: SpatializedContainerObject
  /** Parent portal instance when nested portals are in use. */
  readonly parentPortalInstanceObject: PortalInstanceObject | null
  /** The attached spatial element once creation succeeds. */
  spatializedElement?: SpatializedElement

  /** Caches DOM metadata refreshed from the current bound node. */
  private cachedDomInfo?: CachedDomInfo

  /** Returns the cached DOM node used by this portal instance. */
  get dom(): HTMLElement | undefined {
    return this.cachedDomInfo?.dom
  }

  /** Returns the cached computed style snapshot for the DOM node. */
  get computedStyle(): CSSStyleDeclaration | undefined {
    return this.cachedDomInfo?.computedStyle
  }

  /** Returns whether the cached DOM node is fixed-positioned. */
  get isFixedPosition(): boolean | undefined {
    return this.cachedDomInfo?.isFixedPosition
  }

  /** Caches the most recent viewport-relative DOM rect. */
  private cachedDomRect?: DomRect

  /** Returns the most recent cached DOM rect. */
  get domRect(): DomRect | undefined {
    return this.cachedDomRect
  }

  /** Caches transform/visibility data pushed by the container runtime. */
  private cachedTransformVisibilityInfo?: CachedTransformVisibilityInfo

  /** Returns the cached spatial transform matrix. */
  get transformMatrix() {
    return this.cachedTransformVisibilityInfo?.transformMatrix
  }

  /** Returns the cached visibility string. */
  get visibility() {
    return this.cachedTransformVisibilityInfo?.visibility
  }

  /** Resolves once a spatialized element has been attached to this portal. */
  private spatializedElementPromise?: Promise<SpatializedElement>

  /** Resolves the deferred spatialized element promise. */
  private spatializedElementResolver?: (
    spatializedElement: SpatializedElement,
  ) => void

  /** Computes additional spatial element properties from computed style. */
  private getExtraSpatializedElementProperties?: (
    computedStyle: CSSStyleDeclaration,
  ) => Record<string, string | number>

  /**
   * Creates a portal runtime object for a spatial node.
   *
   * @param spatialId - Stable spatial id used to locate the node.
   * @param spatializedContainerObject - Owning container runtime object.
   * @param parentPortalInstanceObject - Parent portal instance, if nested.
   * @param getExtraSpatializedElementProperties - Optional extra property mapper.
   */
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

  /** Registers container listeners required by this portal instance. */
  init() {
    this.spatializedContainerObject.onSpatialTransformVisibilityChange(
      this.spatialId,
      this.onSpatialTransformVisibilityChange,
    )
  }

  /** Unregisters container listeners when the portal instance unmounts. */
  destroy() {
    this.spatializedContainerObject.offSpatialTransformVisibilityChange(
      this.spatialId,
      this.onSpatialTransformVisibilityChange,
    )
  }

  /** Handles transform/visibility updates pushed by the spatial container. */
  private onSpatialTransformVisibilityChange = (
    spatialTransform: SpatialTransformVisibility,
  ) => {
    this.cachedTransformVisibilityInfo = {
      transformMatrix: new DOMMatrix(spatialTransform.transform),
      visibility: spatialTransform.visibility,
    }
    this.updateSpatializedElementProperties()
  }

  /** Refreshes cached DOM state after the bound 2D frame changes. */
  notify2DFrameChange() {
    const dom = this.spatializedContainerObject.querySpatialDomBySpatialId(
      this.spatialId,
    )
    if (!dom) {
      return
    }
    const computedStyle = getComputedStyle(dom)
    this.cachedDomInfo = {
      dom,
      computedStyle,
      isFixedPosition: computedStyle.getPropertyValue('position') === 'fixed',
    }

    this.updateSpatializedElementProperties()

    const __innerSpatializedElement = () => this.spatializedElement

    Object.assign(dom, {
      __innerSpatializedElement,
    })
  }

  /** Returns the deferred spatialized element promise for parent attachment. */
  private async getSpatializedElement() {
    return this.spatializedElementPromise
  }

  /**
   * Attaches the created spatial element to this portal instance.
   *
   * @param spatializedElement - The created spatial element instance.
   */
  attachSpatializedElement(spatializedElement: SpatializedElement) {
    this.spatializedElement = spatializedElement
    // attach to spatializedContainerObject
    this.addToParent(spatializedElement)
    this.spatializedElementResolver?.(spatializedElement)

    this.updateSpatializedElementProperties()
  }

  /** Prevents duplicate parent attachment work from racing. */
  private inAddingToParent: boolean = false

  /**
   * Attaches the spatial element to either the page or the parent portal
   * element, depending on layout.
   *
   * @param spatializedElement - The spatial element to attach.
   */
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

  /** Recomputes and syncs spatial element properties from cached DOM state. */
  private updateSpatializedElementProperties() {
    // console.log('updateSpatializedElement', this.spatializedElement)
    // read from spatializedContainerContext
    const dom = this.dom
    const spatializedElement = this.spatializedElement
    const visibility = this.visibility
    if (!dom || !spatializedElement || !visibility || !this.transformMatrix) {
      // console.log(
      //   `not ready to  updateSpatializedElementProperties! dom is ${!!dom} spatializedElement is ${spatializedElement} visibility is ${visibility}`,
      // )
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
    const scrollWithParent = !isFixedPosition

    const display = computedStyle.getPropertyValue('display')
    const visible = visibility === 'visible' && display !== 'none'

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

    const properties: Record<string, any> = {
      clientX: x,
      clientY: y,
      width,
      height,
      depth,
      backOffset,
      opacity: this.readOpacity(computedStyle),
      scrollWithParent,
      zIndex,
      visible,
      rotationAnchor,
      ...extraProperties,
    }

    spatializedElement.updateProperties(properties)
    spatializedElement.updateTransform(this.transformMatrix!)

    // assign spatializedElement to dom
    Object.assign(this.dom, {
      __spatializedElement: spatializedElement,
    })
  }

  private readOpacity(computedStyle: CSSStyleDeclaration): number {
    const parsed = Number.parseFloat(computedStyle.getPropertyValue('opacity'))
    return Number.isFinite(parsed) ? parsed : 1
  }
}

export const PortalInstanceContext = createContext<PortalInstanceObject | null>(
  null,
)

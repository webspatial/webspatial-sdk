import { createContext } from 'react'
import { SpatialID } from '../SpatialID'
import { SpatialTransformVisibility } from '../types'

export class SpatializedContainerObject {
  dom: HTMLElement | null = null
  domSpatialId: string | null = null

  private fns: Record<string, () => void> = {}
  // cache dom for each spatialId
  private spatialId2dom: Record<string, HTMLElement> = {}
  private spatialId2parentSpatialDom: Record<string, HTMLElement> = {}

  // layer : [standardInstance sequence, portalInstance sequence]
  private layerSequences: Record<number, [number, number]> = {}

  public notify2DFramePlaceHolderChange(dom: HTMLElement) {
    this.dom = dom
    this.domSpatialId = dom.getAttribute(SpatialID)
    Object.values(this.fns).forEach(fn => fn())
  }

  private spatialId2transformVisibility: Record<
    string,
    SpatialTransformVisibility
  > = {}
  public updateSpatialTransformVisibility(
    spatialId: string,
    spatialTransformVisibility: SpatialTransformVisibility,
  ) {
    this.spatialId2transformVisibility[spatialId] = spatialTransformVisibility
    // notify
    this.fnsForSpatialTransformVisibility[spatialId]?.forEach(fn =>
      fn(spatialTransformVisibility),
    )
  }

  // notify when TransformVisibilityTaskContainer data change
  private fnsForSpatialTransformVisibility: Record<
    string,
    Array<(spatialTransformVisibility: SpatialTransformVisibility) => void>
  > = {}

  // used by StandardSpatializedContainer and PortalSpatializedContainer
  public onSpatialTransformVisibilityChange(
    spatialId: string,
    fn: (spatialTransformVisibility: SpatialTransformVisibility) => void,
  ) {
    if (!this.fnsForSpatialTransformVisibility[spatialId]) {
      this.fnsForSpatialTransformVisibility[spatialId] = []
    }
    this.fnsForSpatialTransformVisibility[spatialId].push(fn)
    if (this.spatialId2transformVisibility[spatialId]) {
      fn(this.spatialId2transformVisibility[spatialId])
    }
  }

  public offSpatialTransformVisibilityChange(spatialId: string) {
    delete this.fnsForSpatialTransformVisibility[spatialId]
  }

  public on2DFrameChange(spatialId: string, fn: () => void) {
    this.fns[spatialId] = fn
    if (this.dom) {
      fn()
    }
  }

  public off2DFrameChange(spatialId: string) {
    delete this.fns[spatialId]
    delete this.spatialId2dom[spatialId]
    delete this.spatialId2parentSpatialDom[spatialId]
  }

  public querySpatialDomBySpatialId(spatialId: string) {
    if (this.domSpatialId === spatialId) {
      return this.dom
    }
    if (!this.dom) {
      return null
    }
    if (!this.spatialId2dom[spatialId]) {
      const spatialDom = this.dom.querySelector(`[${SpatialID}="${spatialId}"]`)

      if (spatialDom) {
        this.spatialId2dom[spatialId] = spatialDom as HTMLElement
      }
    }
    return this.spatialId2dom[spatialId]
  }

  public queryParentSpatialDomBySpatialId(spatialId: string) {
    if (this.domSpatialId === spatialId) {
      return null
    }

    if (this.spatialId2parentSpatialDom[spatialId]) {
      // early return if already found
      return this.spatialId2parentSpatialDom[spatialId]
    }

    let spatialDom = this.querySpatialDomBySpatialId(spatialId)
    if (spatialDom) {
      if (spatialDom === this.dom) return null
      let parentSpatialDom = spatialDom.parentElement as HTMLElement
      while (parentSpatialDom && spatialDom !== this.dom) {
        if (parentSpatialDom.hasAttribute(SpatialID)) {
          break
        } else {
          parentSpatialDom = parentSpatialDom.parentElement as HTMLElement
        }
      }

      this.spatialId2parentSpatialDom[spatialId] = parentSpatialDom
      return parentSpatialDom
    }
    return null
  }

  public getSpatialId(
    layer: number,
    isInStandardInstance: boolean,
    name: string = '',
  ): string {
    if (this.layerSequences[layer] === undefined) {
      this.layerSequences[layer] = [0, 0]
    }
    const idx = isInStandardInstance ? 0 : 1
    const sequenceId = this.layerSequences[layer][idx]
    this.layerSequences[layer][idx] = sequenceId + 1
    const spatialId = `${name}_${layer}_${sequenceId}`
    return spatialId
  }
}

export const SpatializedContainerContext =
  createContext<SpatializedContainerObject | null>(null)

import { createContext } from 'react'
import { SpatialID } from './const'

export class SpatialReactContextObject {
  debugName: string

  constructor(debugName: string) {
    this.debugName = debugName
  }

  dom: HTMLElement | null = null
  domSpatialId: string | null = null

  private fns: Record<string, () => void> = {}
  // cache dom for each spatialId
  private spatialId2dom: Record<string, HTMLElement> = {}
  private spatialId2parentSpatialDom: Record<string, HTMLElement> = {}

  // layer : [standardInstance sequence, portalInstance sequence]
  private layerSequences: Record<number, [number, number]> = {}

  public getSpatialID(
    layer: number,
    isInStandardInstance: boolean,
    debugName: string = '',
  ): string {
    if (this.layerSequences[layer] === undefined) {
      this.layerSequences[layer] = [0, 0]
    }
    const idx = isInStandardInstance ? 0 : 1
    const sequenceId = this.layerSequences[layer][idx]
    this.layerSequences[layer][idx] = sequenceId + 1
    const spatialId = `${debugName}_${layer}_${sequenceId}`

    console.log(
      `dbg ${debugName} isInStandardInstance ${isInStandardInstance} getSpatialID ${spatialId}`,
    )
    return spatialId
  }

  public onDomChange(spatialId: string, fn: () => void) {
    this.fns[spatialId] = fn
    if (this.dom) {
      fn()
    }
  }

  public offDomChange(spatialId: string) {
    delete this.fns[spatialId]
    delete this.spatialId2dom[spatialId]
    delete this.spatialId2parentSpatialDom[spatialId]
  }

  public notifyDomChange(dom: HTMLElement) {
    this.dom = dom
    this.domSpatialId = dom.getAttribute(SpatialID)
    Object.values(this.fns).forEach(fn => fn())
  }

  public querySpatialDom(spatialId: string) {
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

  public queryParentSpatialDom(spatialId: string) {
    if (this.domSpatialId === spatialId) {
      return null
    }

    if (this.spatialId2parentSpatialDom[spatialId]) {
      // early return if already found
      return this.spatialId2parentSpatialDom[spatialId]
    }

    let spatialDom = this.querySpatialDom(spatialId)
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
}

export const SpatialReactContext =
  createContext<SpatialReactContextObject | null>(null)

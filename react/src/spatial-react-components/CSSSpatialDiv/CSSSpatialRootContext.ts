import { createContext } from 'react'

export const CSSSpatialID = 'CSSSpatialID'

export class CSSSpatialRootContextObject {
  prefix = 'css'

  domSpatialId: string | null = null

  private fns: Record<string, (dom: HTMLElement | null) => void> = {}
  // cache dom for each spatialId
  private spatialId2dom: Record<string, HTMLElement> = {}

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
    const spatialId = `${this.prefix}_${debugName}_${layer}_${sequenceId}`

    return spatialId
  }

  public onDomChange(spatialId: string, fn: (dom: HTMLElement | null) => void) {
    this.fns[spatialId] = fn
  }

  public offDomChange(
    spatialId: string,
    fn: (dom: HTMLElement | null) => void,
  ) {
    delete this.fns[spatialId]
  }

  public setCSSParserRef(cssSpatialID: string, domElement: HTMLElement | null) {
    if (domElement) {
      this.spatialId2dom[cssSpatialID] = domElement
    } else {
      delete this.spatialId2dom[cssSpatialID]
    }
    this.fns[cssSpatialID]?.(domElement)
  }
}

export const CSSSpatialRootContext =
  createContext<CSSSpatialRootContextObject | null>(null)

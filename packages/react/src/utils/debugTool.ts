import { Spatialized2DElement } from '@webspatial/core-sdk'
import { getSession } from './getSession'

async function inspectCurrentSpatialScene() {
  const spatialScene = getSession()!.getSpatialScene()
  return spatialScene.inspect()
}

function getSpatialized2DElement(
  spatialized2DElement: HTMLDivElement,
): Spatialized2DElement {
  return (
    spatialized2DElement as any
  ).__innerSpatializedElement?.() as Spatialized2DElement
}

export function enableDebugTool() {
  Object.assign(window, {
    inspectCurrentSpatialScene,
    getSpatialized2DElement,
  })
}

import { getSession } from './getSession'

async function getStat() {
  //@ts-ignore
  const statsInfo = await getSession()!._getStats()

  return statsInfo
}
 

async function inspectCurrentSpatialScene() {
  const spatialScene = getSession()!.getSpatialScene()
  return spatialScene.inspect()
}

export function enableDebugTool() {
  const session = getSession()
  Object.assign(window, {
    session,
    getStat,
    inspectCurrentSpatialScene,
  })
}

import { Spatial } from '@webspatial/core-sdk'

const spatial = new Spatial()
const session = spatial.requestNewSession()
console.log('session', session)

export function testSpatialSceneCorner() {
  if (session) {
    const spatialScene = session.getSpatialScene()
    spatialScene.updateSpatialCorner({
      topLeading: 30,
      bottomLeading: 10,
      topTrailing: 10,
      bottomTrailing: 10,
    })
  }
}

export function testSpatialSceneMaterial() {
  if (session) {
    const spatialScene = session.getSpatialScene()
    spatialScene.updateSpatialMaterial('translucent')
  }
}

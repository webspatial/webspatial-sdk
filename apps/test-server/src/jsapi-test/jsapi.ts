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

export async function testSpatialPing() {
  if (session) {
    const ret = await session.ping()
    console.log('ret', ret)
  }
}

export async function testCreateSpatialized2DElementPing() {
  if (session) {
    const ret = await session.createSpatialized2DElement()
    console.log('ret', ret)
  }
}

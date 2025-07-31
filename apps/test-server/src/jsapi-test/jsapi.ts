import { Spatial, Spatialized2DElement } from '@webspatial/core-sdk'

const spatial = new Spatial()
const session = spatial.requestNewSession()
console.log('session', session)

export function testSpatialSceneCorner() {
  if (session) {
    const spatialScene = session.getSpatialScene()
    spatialScene.updateSpatialProperties({
      cornerRadius: {
        topLeading: 30,
        bottomLeading: 10,
        topTrailing: 10,
        bottomTrailing: 10,
      },
    })
  }
}

export function testSpatialSceneMaterial() {
  if (session) {
    const spatialScene = session.getSpatialScene()
    spatialScene.updateSpatialProperties({
      material: 'translucent',
    })
  }
}

export async function testSpatialPing() {
  if (session) {
    const ret = await session.ping()
    console.log('ret', ret)
  }
}

export async function testCreateSpatialized2DElement() {
  if (session) {
    const spatialized2DElement: Spatialized2DElement =
      await session.createSpatialized2DElement()
    await spatialized2DElement.updateProperties({
      width: 300,
      height: 300,
      rotationAnchor: {
        x: 1,
        y: 2,
        z: 0.5,
      },
      scrollEnabled: false,
    })

    const spatialScene = session.getSpatialScene()
    await spatialScene.addSpatializedElement(spatialized2DElement)

    await spatialized2DElement.updateTransform({
      position: {
        x: 450,
        y: 450,
        z: 50,
      },
    })

    await spatialized2DElement.updateProperties({ material: 'translucent' })
    await spatialized2DElement.updateProperties({
      cornerRadius: {
        topLeading: 10,
        bottomLeading: 10,
        topTrailing: 10,
        bottomTrailing: 10,
      },
    })
    spatialized2DElement.windowProxy.document.body.style.background = 'green'

    // Sub Spatialized2DElement
    // const subSpatialized2DElement: Spatialized2DElement =
    //   await session.createSpatialized2DElement()
    // await subSpatialized2DElement.updateTransform({
    //   position: {
    //     x: 50,
    //     y: 50,
    //     z: 50,
    //   },
    // })
    // await subSpatialized2DElement.updateProperties({
    //   width: 50,
    //   height: 50,
    // })

    // await spatialized2DElement.addSpatializedElement(subSpatialized2DElement)
    // subSpatialized2DElement.windowProxy.document.body.style.background =
    //   '#ffffff00'

    //  (window as any).spatialized2DElement = spatialized2DElement
  }
}

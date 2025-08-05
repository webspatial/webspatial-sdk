import {
  Spatial,
  Spatialized2DElement,
  SpatializedStatic3DElement,
} from '@webspatial/core-sdk'

import { Quaternion, Euler } from 'three'
const euler = new Euler(0, 0, Math.PI / 4)
// const euler = new Euler(0, 0, 0)
const quaternion = new Quaternion().setFromEuler(euler)
const transform = {
  position: { x: 0, y: 0, z: 0 },
  quaternion: {
    x: quaternion.x,
    y: quaternion.y,
    z: quaternion.z,
    w: quaternion.w,
  },
  scale: { x: 1, y: 1, z: 1 },
}

const spatial = new Spatial()
const session = spatial.requestSession()
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

export async function testSpatialInspect(
  spatialObject: Spatialized2DElement | SpatializedStatic3DElement,
) {
  if (session) {
    const ret = await spatialObject.inspect()
    console.log('ret', ret)
  }
}

export async function testSpatialSceneInspect() {
  if (session) {
    const spatialScene = session.getSpatialScene()
    const ret = await spatialScene.inspect()
    console.log('SpatialScene inspect', ret)
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

    return spatialized2DElement
  }
}

export async function testCreateSpatializedStatic3DElement(
  parent: Spatialized2DElement | null = null,
) {
  if (session) {
    const spatialObject: SpatializedStatic3DElement =
      await session.createSpatializedStatic3DElement()

    await spatialObject.updateProperties({
      width: 150,
      height: 150,
      rotationAnchor: {
        x: 0.5,
        y: 0.5,
        z: 0.5,
      },
      modelURL: 'http://localhost:5173/public/modelasset/cone.usdz',
    })

    await spatialObject.updateTransform({
      position: {
        x: 150,
        y: 150,
        z: 10,
      },

      quaternion: transform.quaternion,
    })

    console.log('dbg quaternion', quaternion)

    if (parent) {
      parent.addSpatializedElement(spatialObject)
    } else {
      const spatialScene = session.getSpatialScene()
      await spatialScene.addSpatializedElement(spatialObject)
    }
  }
}

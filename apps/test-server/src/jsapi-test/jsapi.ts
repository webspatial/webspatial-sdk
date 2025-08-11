import {
  Spatial,
  Spatialized2DElement,
  SpatializedStatic3DElement,
} from '@webspatial/core-sdk'

import { Quaternion, Euler, Vec2 } from 'three'
// const euler = new Euler(0, Math.PI / 3, 0)
// const euler = new Euler(0, 0, Math.PI / 4)
const euler = new Euler(0, 0, 0)
const quaternion = new Quaternion().setFromEuler(euler)
const transform = {
  position: { x: 0, y: 0, z: 100 },
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
      width: 800,
      height: 800,
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
        x: 100,
        y: 10,
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
    spatialized2DElement.windowProxy.document.body.style.background =
      'transparent'
    spatialized2DElement.windowProxy.document.body.textContent = 'hello world'

    spatialized2DElement.windowProxy.document.title = 'spatialized2DElement'
    return spatialized2DElement
  }
}

export async function testAddMultipleSpatialized2DElement(
  parent: Spatialized2DElement | null = null,
) {
  if (session) {
    const spatialScene = session.getSpatialScene()

    const spatialized2DElementA: Spatialized2DElement =
      await session.createSpatialized2DElement()
    await spatialized2DElementA.updateProperties({
      name: 'A',
      width: 300,
      height: 300,
      scrollEnabled: false,
    })

    await spatialized2DElementA.updateTransform({
      position: {
        x: 320,
        y: 150,
        z: 10,
      },
    })
    spatialized2DElementA.windowProxy.document.body.style.background =
      'rgb(5, 0, 128)'
    spatialized2DElementA.windowProxy.document.title = 'A'
    spatialized2DElementA.windowProxy.document.documentElement.style.width =
      '300px'
    spatialized2DElementA.windowProxy.document.documentElement.style.height =
      '300px'
    spatialized2DElementA.windowProxy.document.body.style.position = 'absolute'
    spatialized2DElementA.windowProxy.document.body.style.left = '0px'
    spatialized2DElementA.windowProxy.document.body.style.top = '0px'
    spatialized2DElementA.windowProxy.document.body.style.width = '300px'
    spatialized2DElementA.windowProxy.document.body.style.height = '300px'

    if (parent) {
      parent.addSpatializedElement(spatialized2DElementA)
    } else {
      await spatialScene.addSpatializedElement(spatialized2DElementA)
    }

    // create spatialized2DElementB
    const spatialized2DElementB: Spatialized2DElement =
      await session.createSpatialized2DElement()
    await spatialized2DElementB.updateProperties({
      name: 'B',
      width: 200,
      height: 100,
      scrollEnabled: false,
    })
    await spatialized2DElementB.updateTransform({
      position: {
        x: 100,
        y: 50,
        z: 20,
      },
    })
    spatialized2DElementB.windowProxy.document.title = 'B'
    spatialized2DElementB.windowProxy.document.body.style.background =
      'transparent'
    spatialized2DElementB.windowProxy.document.documentElement.style.width =
      '300px'
    spatialized2DElementB.windowProxy.document.documentElement.style.height =
      '300px'
    spatialized2DElementB.windowProxy.document.body.textContent = 'hello world'

    spatialized2DElementB.windowProxy.document.body.style.position = 'absolute'
    spatialized2DElementB.windowProxy.document.body.style.left = '0px'
    spatialized2DElementB.windowProxy.document.body.style.top = '0px'
    spatialized2DElementB.windowProxy.document.body.style.width = '300px'
    spatialized2DElementB.windowProxy.document.body.style.height = '300px'

    if (parent) {
      parent.addSpatializedElement(spatialized2DElementB)
    } else {
      await spatialScene.addSpatializedElement(spatialized2DElementB)
    }
  }
}

export async function testAddMultipleSpatializedStatic3DElement(
  parent: Spatialized2DElement | null = null,
) {
  if (session) {
    const spatialScene = session.getSpatialScene()

    const spatializedStatic3DElementA: SpatializedStatic3DElement =
      await session.createSpatializedStatic3DElement()
    await spatializedStatic3DElementA.updateProperties({
      name: 'A',
      width: 200,
      height: 200,
      modelURL: 'http://localhost:5173/public/modelasset/cone.usdz',
    })

    await spatializedStatic3DElementA.updateTransform({
      position: {
        x: 0,
        y: 0,
        z: 0,
      },
    })

    if (parent) {
      parent.addSpatializedElement(spatializedStatic3DElementA)
    } else {
      await spatialScene.addSpatializedElement(spatializedStatic3DElementA)
    }

    // create
    const spatializedStatic3DElementB: SpatializedStatic3DElement =
      await session.createSpatializedStatic3DElement()
    await spatializedStatic3DElementB.updateProperties({
      name: 'B',
      width: 200,
      height: 200,
      modelURL: 'http://localhost:5173/public/modelasset/cone.usdz',
    })

    await spatializedStatic3DElementB.updateTransform({
      position: {
        x: 300,
        y: 0,
        z: 0,
      },
    })

    if (parent) {
      parent.addSpatializedElement(spatializedStatic3DElementB)
    } else {
      await spatialScene.addSpatializedElement(spatializedStatic3DElementB)
    }
  }
}

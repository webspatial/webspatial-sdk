import {
  Spatial,
  Spatialized2DElement,
  SpatializedStatic3DElement,
} from '@webspatial/core-sdk'

const spatial = new Spatial()
const session = spatial.requestSession()

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
      name: 'ABParent',
      width: 800,
      height: 800,
      rotationAnchor: {
        x: 1,
        y: 2,
        z: 0.5,
      },
    })

    const spatialScene = session.getSpatialScene()
    await spatialScene.addSpatializedElement(spatialized2DElement)

    const matrix = new DOMMatrix()
    matrix.translate(100, 10, 50)
    await spatialized2DElement.updateTransform(matrix)

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
    spatialized2DElement.windowProxy.document.body.textContent = 'ABParent'

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
    })

    await spatialized2DElementA.updateTransform(
      new DOMMatrix().translate(320, 150, 10),
    )
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
    spatialized2DElementA.windowProxy.document.body.style.color = 'white'
    spatialized2DElementA.windowProxy.document.body.textContent =
      'A: webview without gesture enabled '

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
    })

    const matrix = new DOMMatrix()
    matrix.translate(100, 50, 20)
    await spatialized2DElementB.updateTransform(matrix)
    spatialized2DElementB.windowProxy.document.title = 'B'
    spatialized2DElementB.windowProxy.document.body.style.background = 'green'
    spatialized2DElementB.windowProxy.document.documentElement.style.width =
      '300px'
    spatialized2DElementB.windowProxy.document.documentElement.style.height =
      '300px'

    spatialized2DElementB.windowProxy.document.body.textContent =
      'B: webview with gesture enabled '
    //
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
      name: 'ModelA',
      width: 200,
      height: 200,
      modelURL: '/modelasset/cone.usdz',
    })

    const matrix = new DOMMatrix().translate(0, 0, 0)
    await spatializedStatic3DElementA.updateTransform(matrix)

    if (parent) {
      parent.addSpatializedElement(spatializedStatic3DElementA)
    } else {
      await spatialScene.addSpatializedElement(spatializedStatic3DElementA)
    }

    // create
    const spatializedStatic3DElementB: SpatializedStatic3DElement =
      await session.createSpatializedStatic3DElement()
    await spatializedStatic3DElementB.updateProperties({
      name: 'ModelB',
      width: 200,
      height: 200,
      modelURL: '/modelasset/cone.usdz',
    })

    await spatializedStatic3DElementB.updateTransform(
      new DOMMatrix().translate(300, 0, 0),
    )

    if (parent) {
      parent.addSpatializedElement(spatializedStatic3DElementB)
    } else {
      await spatialScene.addSpatializedElement(spatializedStatic3DElementB)
    }
  }
}

// export async function testAddMultipleSpatializedDynamic3DElement(
//   parent: Spatialized2DElement | null = null,
// ) {
//   if (session) {
//     const spatialScene = session.getSpatialScene()
//   }
// }

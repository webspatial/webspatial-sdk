import { Spatial, SpatialEntity } from '@xrsdk/runtime'

import { SpatialDiv, getSession } from '@xrsdk/react'

import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BlurShaderUtils } from 'three/examples/jsm/Addons.js'
import { NestedDivsTest } from '../reactRouter/tests/nestedDivs'

// document.body.style.background = 'red';
async function createSession() {
  var testResult = []
  var spatial: Spatial | null = new Spatial()
  if (!spatial.isSupported()) {
    spatial = null
  }
  var session
  if (spatial) {
    session = spatial.requestSession()
    testResult = ['CreateSpatialSession', true]
    return testResult
  } else {
    testResult = ['CreateSpatialSession', false, 'Spatial not supported']
    return testResult
  }
}

async function createWebViewJSAPI() {
  var testResult = []
  var spatial = new Spatial()
  let session = await spatial.requestSession()
  if (!spatial.isSupported()) {
    return (testResult = ['WebView JS API', false, ''])
  }
  try {
    await session.log('Trying to load webview')

    console.log('a')
    console.log(session)
    var e = await session.createEntity()
    console.log('b')
    e.transform.position.x = 500
    e.transform.position.y = 300
    e.transform.position.z = 300
    var wc = await session.getCurrentWindowComponent()
    var ent = await wc.getEntity()
    await e.setParent(ent!)
    await e.updateTransform()

    //create an window
    let i = await session.createWindowComponent()
    await Promise.all([
      i.loadURL('/src/embed/basic.html'),
      i.setScrollEnabled(false),
      e.setCoordinateSpace('Dom'),
      i.setResolution(300, 300),
    ])
    //bind window to entity
    await e.setComponent(i)

    //position update
    var loop = (time: DOMHighResTimeStamp) => {
      if (e.isDestroyed()) {
        return
      }
      session.requestAnimationFrame(loop)
      e.transform.position.x = 500 + Math.sin(time / 1000) * 200
      e.updateTransform()
    }
    session.requestAnimationFrame(loop)

    //destory
    await new Promise(resolve => setTimeout(resolve, 1000))
    await e.destroy()
    await i.destroy()
    await session.log('destroy complete')

    testResult = ['WebView JS API', true, '']
    return testResult
  } catch (e) {
    testResult = ['WebView JS API', false, e]
    return testResult
  }
}
async function changeWebViewStyle() {
  var testResult = []
  var spatial = new Spatial()
  let session = await spatial.requestSession()
  if (!spatial.isSupported()) {
    return (testResult = ['SetGlassBackground', false, ''])
  }
  await (
    await session.getCurrentWindowComponent()
  ).setStyle({ glassEffect: true, cornerRadius: 50 })
  document.documentElement.style.backgroundColor = 'transparent'
  document.body.style.backgroundColor = 'transparent'

  if (document.body.style.backgroundColor === 'transparent') {
    testResult = ['SetGlassBackground', true, '']
    return testResult
  } else {
    testResult = ['SetGlassBackground', false, '']
    return testResult
  }
}

async function webViewMemoryLeakTest() {
  var testResult = []
  var failure_reasons = ''
  var spatial = new Spatial()
  let session = await spatial.requestSession()
  if (!spatial.isSupported()) {
    return (testResult = ['WebView JS API', false, ''])
  }

  await session.log('Trying to load webview')
  if (!spatial.isSupported()) {
    return (testResult = ['WebView JS API', false, ''])
  }

  var stats = await session.getStats()
  if (stats.backend == 'Android') {
    var e1 = await session.createEntity()
    var e2 = await session.createEntity()
    var stats2 = await session.getStats()

    await e1.destroy()
    await e2.destroy()
    if (stats2.objects.count - 2 == stats.objects.count) {
      testResult = ['WebView Memory Leak Test', true, '']
    } else {
      return (testResult = ['WebView Memory Leak Test', false, ''])
    }
    return testResult
  }

  try {
    await session.log('Trying to load webview 1')

    console.log('a')
    console.log(session)
    var e = await session.createEntity()
    console.log('b')
    e.transform.position.x = 500
    e.transform.position.y = 300
    e.transform.position.z = 300
    var wc = await session.getCurrentWindowComponent()
    var ent = await wc.getEntity()
    await e.setParent(ent!)
    await e.updateTransform()

    //create an window
    let i = await session.createWindowComponent()
    await Promise.all([
      i.loadURL('/src/embed/basic.html'),
      i.setScrollEnabled(false),
      e.setCoordinateSpace('Dom'),
      i.setResolution(300, 300),
    ])
    //bind window to entity
    await e.setComponent(i)
    var webview1 = await session.getStats()
    session.log('Webview 1 Stats: ' + JSON.stringify(webview1))
    const windowArrayLength = webview1.refObjects.windowArray.length
    session.log('Webview Ref Counts: ' + windowArrayLength)
    if (windowArrayLength != 2) {
      failure_reasons +=
        'WebView 1 webViewRefs not equal to 2 got ' +
        webview1.data.webViewRefs +
        '\n'
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
    await e.destroy()
    await i.destroy()
    await session.log('WebView 1 destroy complete')
  } catch (e) {
    testResult = ['Error Creating Webview 1 During Mem Leak Test', false, e]
    return testResult
  }

  //creating webview 2 and get memory stats
  try {
    await session.log('Trying to load webview 2')

    console.log('a')
    console.log(session)
    var e = await session.createEntity()
    console.log('b')
    e.transform.position.x = 500
    e.transform.position.y = 300
    e.transform.position.z = 300
    var wc = await session.getCurrentWindowComponent()
    var ent = await wc.getEntity()
    await e.setParent(ent!)
    await e.updateTransform()

    //create an window
    let i = await session.createWindowComponent()
    await Promise.all([
      i.loadURL('/src/embed/basic.html'),
      i.setScrollEnabled(false),
      e.setCoordinateSpace('Dom'),
      i.setResolution(300, 300),
    ])
    //bind window to entity
    await e.setComponent(i)
    var webview2 = await session.getStats()
    const windowArrayLength = webview1.refObjects.windowArray.length
    session.log('Webview 2 Stats: ' + JSON.stringify(webview2))
    session.log('Webview Ref Counts: ' + windowArrayLength)
    if (windowArrayLength != 2) {
      failure_reasons += 'WebView 2 webViewRefs not equal to 2\n'
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
    await e.destroy()
    await i.destroy()
    await session.log('WebView 2 destroy complete')
  } catch (e) {
    testResult = ['Error Creating Webview 2 During Mem Leak Test', false, e]
    return testResult
  }
  if (failure_reasons) {
    testResult = ['WebView Memory Leak Test', false, failure_reasons]
    return testResult
  } else {
    testResult = ['WebView Memory Leak Test', true, '']
    return testResult
  }
}

async function nestedDivsTest() {
  console.log('NestedDivsTest')
  var testResult = []
  var spatial = new Spatial()
  let session = await spatial.requestSession()
  var root = document.createElement('div')
  document.body.appendChild(root)
  ReactDOM.createRoot(root).render(<NestedDivRender />)
  await getSession()

  var stats = await session.getStats()
  if (stats.backend == 'Android') {
    var objCount = 0
    var retry = 0
    while (objCount != 15) {
      await timeout(50)
      var sessionStats = await session.getStats()
      objCount = sessionStats.objects.count
      retry++
      if (retry > 100) {
        break
      }
    }
    if (stats.objects.count == 3 && objCount == 15) {
      testResult = ['NestedDivsTest', true, '']
    } else {
      return (testResult = ['NestedDivsTest', false, ''])
    }
    return testResult
  }

  var entityCount = 0
  var retry = 0
  while (entityCount != 7) {
    await timeout(50)
    var sessionStats = await session.getStats()
    entityCount = sessionStats.objects.entityArray.length
    retry++
    if (retry > 40) {
      break
    }
  }
  await session.log('nestedDivs Stats: ' + JSON.stringify(entityCount))
  if (entityCount == 7) {
    testResult = ['NestedDivsTest', true, '']
  } else {
    testResult = [
      'NestedDivsTest',
      false,
      'Expected 7 entity created, got ' + entityCount,
    ]
  }
  await session.log(testResult)
  document.body.removeChild(root)

  return testResult
}

var allTests = [
  createSession,
  createWebViewJSAPI,
  changeWebViewStyle,
  webViewMemoryLeakTest,
  nestedDivsTest,
]

class TestRunner {
  _started = false
  start() {
    this._started = true
    ;(async () => {
      for (let test of allTests) {
        var result = await test()
        this._onTestCompleteInternal({
          name: result[0],
          result: result[1] ? 'Pass' : 'Fail',
          reason: result[2],
        })
      }
    })()
  }
  stop() {
    this._started = false
  }
  _onTestCompleteInternal = (tr: any) => {
    if (this._started) {
      this.onTestComplete(tr)
    }
  }
  onTestComplete = (tr: any) => {}
}

function timeout(delay: number) {
  return new Promise(res => setTimeout(res, delay))
}

function NestedDivRender() {
  const [depth, setDepth] = useState(1)
  var redCol = '#cc111144'
  var greenCol = '#11cc1144'
  var blueCol = '#1111cc44'

  return (
    <>
      <SpatialDiv
        debugName="PARENT A ROOT"
        spatialStyle={{
          position: { z: depth * 10, x: 0, y: 0 },
          glassEffect: false,
        }}
        style={{ height: 300, backgroundColor: redCol }}
      >
        <p>Hello world A</p>
        <SpatialDiv
          debugName="CHILD A1"
          spatialStyle={{
            position: { z: depth * 30, x: 0, y: 0 },
            glassEffect: false,
          }}
          style={{ height: 100, backgroundColor: blueCol }}
        >
          <p>Hello world B</p>
        </SpatialDiv>
      </SpatialDiv>
      <SpatialDiv
        debugName="PARENT B ROOT"
        spatialStyle={{
          position: { z: depth * 10, x: 0, y: 0 },
          glassEffect: true,
        }}
        style={{ height: 300, backgroundColor: redCol }}
      >
        <p>Hello world A</p>
        <SpatialDiv
          debugName="CHILD B1"
          spatialStyle={{
            position: { z: depth * 20, x: 0, y: 0 },
            glassEffect: true,
          }}
          style={{ height: 100, backgroundColor: blueCol }}
        >
          <p>Hello world B</p>
          <SpatialDiv
            debugName="CHILD B2"
            spatialStyle={{
              position: { z: depth * 30, x: 0, y: 0 },
              glassEffect: true,
            }}
            style={{ height: 100, backgroundColor: greenCol }}
          >
            <p>Hello world C</p>
          </SpatialDiv>
          <SpatialDiv
            debugName="CHILD B3"
            spatialStyle={{
              position: { z: depth * 30, x: 0, y: 0 },
              glassEffect: true,
            }}
            style={{ height: 100, backgroundColor: redCol }}
          >
            <p>Hello world C</p>
          </SpatialDiv>
        </SpatialDiv>
      </SpatialDiv>
    </>
  )
}

function AllTests() {
  const [testResults, setTestResults] = useState([] as Array<any>)

  useEffect(() => {
    let tr = new TestRunner()
    tr.onTestComplete = testResult => {
      setTestResults(ol => [...ol, testResult])
    }
    tr.start()
    return () => {
      tr.stop()
    }
  }, [])
  //console.log(testResults)
  return (
    <>
      <h1>All test</h1>

      {testResults.map((testResult, i) => {
        return (
          <div
            key={i}
            style={{
              backgroundColor: testResult.result === 'Pass' ? 'green' : 'red',
            }}
          >
            <h1>{testResult.name}</h1>
            {testResult.result}: {testResult.reason}
          </div>
        )
      })}
    </>
  )
}

var root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(<AllTests />)

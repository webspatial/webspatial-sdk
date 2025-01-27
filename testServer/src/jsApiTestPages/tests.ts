import { Euler, Quaternion, Vector3 } from 'three'
import { Spatial, SpatialEntity, SpatialSession } from '@xrsdk/runtime'

class TimerLog {
  lastTime = Date.now()
  constructor(public session: SpatialSession) { }

  logDiff(str: String) {
    var curTime = Date.now()
    var deltaMS = curTime - this.lastTime
    this.session.log('TimerLog ' + str + ': ' + deltaMS + 'ms')
  }
}
class TestHelper {
  // https://colorhunt.co/palette/ffb6b9fae3d9bbded661c0bf
  static colors = {
    a: '#FFB6B9',
    b: '#FAE3D9',
    c: '#BBDED6',
    d: '#61C0BF',
  }

  constructor(public session: SpatialSession) { }

  async delay(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms))
  }

  setWebContent = async (win: Window, content: string, refVar: any) => {
    var newDiv = document.createElement('div')
    for (var key in refVar) {
      ; (win as any)[key] = refVar[key]
    }
    newDiv.innerHTML = content
    win.document.body.appendChild(newDiv)
    await this.delay(20)
  }

  async addToCurrentWindow(e: SpatialEntity) {
    var wc = await this.session.getCurrentWindowComponent()
    var ent = await wc.getEntity()
    await e.setParent(ent!)
  }

  async createWindow(options?: {
    position?: any
    resolution?: any
    url?: string
    windowContent?: string
  }) {
    if (!options) {
      options = {}
    }
    if (!options.position) {
      options.position = { x: 500, y: 300, z: 300 }
    }
    if (!options.resolution) {
      options.resolution = { x: 100, y: 100 }
    }
    if (!options.url) {
      options.url = ''
    }

    // Create entity
    var e = await this.session.createEntity()
    if (options.position) {
      e.transform.position.x = options.position.x || 0
      e.transform.position.y = options.position.y || 0
      e.transform.position.z = options.position.z || 0
    }
    await e.updateTransform()

    // Setup window content
    var pageWindow = null
    if (options.url == '') {
      pageWindow = await this.session.createWindowContext()
      await this.setWebContent(
        pageWindow!,
        options.windowContent
          ? options.windowContent
          : `
            <div>This is an example div</div>
            `,
        {
          rootWindow: window,
        },
      )
    }

    // Setup window component
    let wc = await this.session.createWindowComponent()
    var dim = {
      x: 100,
      y: 100,
    }
    if (options.url == '') {
      await wc.setFromWindow(pageWindow!.window)
    } else {
      await wc.loadURL(options.url)
    }
    await wc.setScrollEnabled(false)
    await e.setCoordinateSpace('Dom')
    if (options.resolution) {
      dim.x = options.resolution.x
      dim.y = options.resolution.y
    }
    await wc.setResolution(dim.x, dim.y)
    await e.setComponent(wc)

    // Result
    return {
      entity: e,
      windowComponent: wc,
      windowContext: pageWindow,
    }
  }

  attachToElement(element: HTMLElement, content: any) {
    var update = () => {
      var rect = element.getBoundingClientRect()
      content.entity.transform.position.x = rect.x + rect.width / 2
      content.entity.transform.position.y = rect.y + rect.height / 2
      content.entity.updateTransform()
      content.component.setResolution(rect.width, rect.height)
    }
    var mo = new MutationObserver(update)
    mo.observe(element, { attributes: true })
    var ro = new ResizeObserver(update)
    ro.observe(element)
    update()
  }
}

var main = async () => {
  const urlParams = new URLSearchParams(window.location.search)
  var page = urlParams.get('pageName')
  page = page ? page : 'default'

  var spatial = new Spatial()
  let session = await spatial.requestSession()!
  var testHelper = new TestHelper(session)
  await session.log('        --------------Page loaded: ' + page)

  if (page == 'default') {
    await session.log('Nothing to do')
  } else if (page == 'webView') {
    await session.log('Trying to load webview')

    {
      var w = await testHelper.createWindow({
        resolution: { x: 300, y: 300 },
        url: '/src/embed/basic.html',
      })
      testHelper.addToCurrentWindow(w.entity)

      var loop = (time: DOMHighResTimeStamp) => {
        if (w.entity.isDestroyed()) {
          return
        }
        w.entity.transform.position.x = 500 + Math.sin(time / 1000) * 200
        w.entity.updateTransform()
      }
      session.addOnEngineUpdateEventListener(loop)

      setTimeout(async () => {
        await w.entity.destroy()
        await w.windowComponent.destroy()
        await session.log('destroy complete')
      }, 5000)

      return
    }
  } else if (page == 'spatialView') {
    await session.log('Trying to load webview')

    var e = await session.createEntity()
    e.transform.position.x = 500
    e.transform.position.y = 300
    e.transform.position.z = 0
    var wc = await session.getCurrentWindowComponent()
    var ent = await wc.getEntity()

    await e.updateTransform()
    let i = await session.createViewComponent()
    await i.setResolution(500, 500)
    await e.setComponent(i)

    // Create model ent and add as a child to the spatialView
    var box = await session.createMeshResource({ shape: 'box' })
    var mat = await session.createPhysicallyBasedMaterial()
    await mat.update()
    var customModel = await session.createModelComponent()
    customModel.setMaterials([mat])
    customModel.setMesh(box)
    var e2 = await session.createEntity()
    await e2.setComponent(customModel)
    e2.transform.position.z = -(0.1 / 2 + 0.00001)
    e2.transform.scale = new DOMPoint(1920 / 2 / 1360, 1080 / 2 / 1360, 0.1)
    await e2.updateTransform()
    await e2.setParent(e)

    {
      var box = await session.createMeshResource({ shape: 'sphere' })
      var mat = await session.createPhysicallyBasedMaterial()
      await mat.update()
      var customModel = await session.createModelComponent()
      customModel.setMaterials([mat])
      customModel.setMesh(box)
      var e2 = await session.createEntity()
      await e2.setComponent(customModel)
      e2.transform.position.y = 0.3
      e2.transform.scale = new DOMPoint(0.1, 0.1, 0.1)
      await e2.updateTransform()
      await e2.setParent(e)
    }

    // Load webpage that displays simple game
    var e3 = await session.createEntity()
    e3.transform.position.x = 0
    e3.transform.position.y = 0.0
    e3.transform.position.z = 0
    e3.transform.scale = new DOMPoint(2.0, 2.0, 2.0)
    await e3.updateTransform()
    let win = await session.createWindowComponent()
    await Promise.all([
      win.loadURL('http://coolmathgames.com/0-retro-helicopter/play'),
      // TODO: Bug with there seeming to be a max resolution on some platofrms
      win.setResolution(1920 / 4, 1080 / 4),
    ])
    await e3.setComponent(win)
    await e3.setParent(e)

    // TODO: Bug with attachments on some platforms so window components need to be added prior to adding spatialView to scene
    await e.setParent(ent!)
  } else if (page == 'glassBackground') {
    await (
      await session.getCurrentWindowComponent()
    ).setStyle({
      material: { type: 'default' },
      cornerRadius: 50,
    })
    // await WebSpatial.setWebPanelStyle(WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel())
    document.documentElement.style.backgroundColor = 'transparent'
    document.body.style.backgroundColor = 'transparent'
    await session.log('set to glass background')

    var b = document.createElement('button')
    b.innerHTML = 'Click me'
    document.body.appendChild(b)

    var wc = await session.getCurrentWindowComponent()
    var glassState = true
    b.onclick = async () => {
      glassState = !glassState
      await wc.setStyle({
        material: { type: !glassState ? 'none' : 'default' },
        cornerRadius: 50,
      })
    }
  } else if (page == 'setFromWindow') {
    var createWin = async (pos: number, color: string) => {
      let l = new TimerLog(session)
      // Open a new window
      let openedWindow = await session.createWindowContext()!
      l.logDiff('openedWindow')
      // Create entity
      var entity = await session.createEntity()
      l.logDiff('createEntity')
      entity.transform.position.x = pos
      entity.transform.position.y = 300
      entity.transform.position.z = 50
      await entity.updateTransform()
      l.logDiff('updateTransform')

      // Add entity to the Spatial Group
      var wc = await session.getCurrentWindowComponent()
      var ent = await wc.getEntity()
      await entity.setParent(ent!)

      // Create window component and set its content from the window
      var webview = await session.createWindowComponent()
      await Promise.all([
        webview.setFromWindow(openedWindow!.window),
        webview.setScrollEnabled(false),
        entity!.setCoordinateSpace('Dom'),
        webview.setResolution(200, 200),
      ])
      openedWindow!.document.documentElement.style.backgroundColor = color
      openedWindow!.window.document.body.innerHTML =
        "<p style='color:white;'>hello world</p>"
      await webview.setStyle({ material: { type: 'default' }, cornerRadius: 0 })

      // Attach to entity
      await entity.setComponent(webview)
      l.logDiff('rest')
    }

    await session.log('page start')

    await Promise.all([
      createWin(100 + 200 * 0, 'red'),
      createWin(100 + 200 * 1, 'blue'),
      createWin(100 + 200 * 2, 'green'),
      createWin(100 + 200 * 3, 'yellow'),
    ])

    await session.log('page done done')
  } else if (page == 'model') {
    session.log('create entitys')

    {
      var entities = new Array<{ e: SpatialEntity; v: number }>()

      var box = await session.createMeshResource({ shape: 'box' })
      var model = await session.createModelComponent({
        url: '/src/assets/FlightHelmet.usdz',
      })

      for (var i = 0; i < 7; i++) {
        var e = await session.createEntity()
        e.transform.position = new DOMPoint(
          -0.35 + i * 0.1,
          0,
          0.2 + 0.00001 * i,
        )
        e.transform.scale = new DOMPoint(0.07, 0.07, 0.07)
        await e.updateTransform()

        if (i == 3) {
          await e.setComponent(model)
        } else {
          var mat = await session.createPhysicallyBasedMaterial()
          mat.baseColor.r = Math.random()
          await mat.update()
          var customModel = await session.createModelComponent()
          customModel.setMaterials([mat])
          customModel.setMesh(box)
          await e.setComponent(customModel)
        }
        await e.setParentWindowGroup(await session.getCurrentWindowGroup())
        entities.push({ e: e, v: 0 })
      }
      var b = document.createElement('button')
      b.innerHTML = 'Click me'
      document.body.appendChild(b)

      b.onclick = () => {
        for (var i = 0; i < entities.length; i++) {
          entities[i].v = Math.sqrt((i + 40) * 0.035)
        }
      }

      var q = new Quaternion()

      var dt = 0
      var curTime = Date.now()
      let loop = async (time: DOMHighResTimeStamp) => {
        dt = Date.now() - curTime
        curTime = Date.now()
        var floor = -0.1
        await session.transaction(() => {
          for (var i = 0; i < entities.length; i++) {
            var entity = entities[i].e
            entities[i].v -= 5 * (dt / 1000)
            entity.transform.position.y += (dt / 1000) * entities[i].v
            if (entity.transform.position.y < floor) {
              entity.transform.position.y = floor
              entities[i].v = -entities[i].v * 0.5
            }
            q.setFromEuler(new Euler(0, time / 1000, 0))
            entity.transform.orientation.x = q.x
            entity.transform.orientation.y = q.y
            entity.transform.orientation.z = q.z
            entity.transform.orientation.w = q.w
            entity.transform.scale.y =
              Math.pow((Math.sin(time / 100) + 1) / 2, 5) * 0.02 + 0.07 // 0.07 * (Math.abs((entities[i].v / 2)) + 1)
            entity.updateTransform()
          }
        })
      }
      session.addOnEngineUpdateEventListener(loop)

      session.log('entity created')
      return
    }
  } else if (page == 'pingNativePerf') {
    session.log('Attempt ping start.')
    var pingCount = 200

    // Initialize message
    var charCount = 300
    var str = ''
    for (let i = 0; i < charCount; i++) {
      str += 'x'
    }

    let b = document.createElement('h1')
    document.body.appendChild(b)

    var counter = 0
    let loop = async (time: DOMHighResTimeStamp) => {
      var results = 'Updates per frame: ' + pingCount + '<br>'

      // With transactions
      var startTime = Date.now()
      await session.transaction(() => {
        for (let i = 0; i < pingCount; i++) {
          session._ping(str)
        }
      })
      var delta = Date.now() - startTime
      results +=
        '[With transactions]<br> Average ping time: ' +
        (delta / pingCount).toFixed(3) +
        'ms\nTotal time: ' +
        delta.toFixed(3) +
        'ms Counter:' +
        counter++ +
        '<br><br>\n\n'

      // Without transactions
      var startTime = Date.now()
      for (let i = 0; i < pingCount; i++) {
        if (i == pingCount - 1) {
          await session._ping(str)
        } else {
          session._ping(str)
        }
      }
      var delta = Date.now() - startTime
      results +=
        '[Without transactions]<br> Average ping time: ' +
        delta / pingCount +
        'ms\nTotal time: ' +
        delta +
        'ms Counter:' +
        counter++ +
        '\n'

      // Populate results and request animation frame
      b.innerHTML = results
    }
    session.addOnEngineUpdateEventListener(loop)

    session.log('Got response')
  } else if (page == 'winodwInnerHTML') {
    if (!spatial.isSupported()) {
      return
    }

    for (let j = 0; j < 2; j++) {
      let x = window.open()

      if (x) {
        await session.log('load complete')

        x.document.body.innerHTML = 'Hello World'

        x.document.onclick = () => {
          window.document.body.style.backgroundColor = 'yellow'
        }

        let e = await session.createEntity()
        e.transform.position.x = 500
        e.transform.position.y = 300
        e.transform.position.z = 300

        var wc = await session.getCurrentWindowComponent()
        var ent = await wc.getEntity()
        await e.setParent(ent!)

        await e.updateTransform()
        let i = await session.createWindowComponent()
        x.document.documentElement.style.backgroundColor = 'transparent'
        x.document.documentElement.style.color = 'white'
        x.document.documentElement.style.fontSize = '5em'
        await i.setStyle({
          material: { type: 'none' },
          cornerRadius: 0,
        })
        await Promise.all([
          i.setFromWindow(x),
          i.setScrollEnabled(false),
          e.setCoordinateSpace('Dom'),
          i.setResolution(300, 300),
        ])
        await e.setComponent(i)

        let offset = j

        e.transform.position.x = 500 + Math.sin(0 / 1000) * 200 + offset * 200
        e.updateTransform()
      }
    }
  } else if (page == 'getStats') {
    let b = document.createElement('code')
    b.style.whiteSpace = 'pre-wrap'
    b.style.fontSize = '1em'
    b.innerHTML = 'LOADING'
    document.body.appendChild(b)
    var d = await session._getStats()
    b.innerHTML = '// webviewRefs should be 1\n' + JSON.stringify(d, null, 4)
  }
}
main()

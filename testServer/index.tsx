import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Model, SpatialDiv } from '@webspatial/react-sdk'
import { Spatial, SpatialEntity, SpatialHelper, SpatialViewComponent, Vec3 } from '@webspatial/core-sdk'

function App() {
  let [_supported, setSupported] = useState(false)
  var header = useRef<HTMLDivElement>(null)

  useEffect(() => {
    var isSupported = new Spatial().isSupported()
    setSupported(isSupported)

    if (!isSupported) {
      document.documentElement.style.backgroundColor = '#111111'
    } else {
      var session = SpatialHelper.instance!.session
        ; (async () => {
          // Create SpatialView
          var viewEnt = await session.createEntity()
          await viewEnt.setCoordinateSpace('Dom') // Set coordinate space so its transform is relative to the webpage's pixels
          await viewEnt.setComponent(await session.createViewComponent())

          // Create entities
          var meshResource = await session.createMeshResource({ shape: 'sphere' })
          var entities = new Array<{
            e: SpatialEntity
            v: { x: number; y: number; z: number }
          }>()
          for (var i = 0; i < 7; i++) {
            let e = await session.createEntity()
            e.transform.position = new Vec3(-0.35 + i * 0.1, 0, -0.5)
            e.transform.scale = new Vec3(0.1, 0.1, 0.1)
            await e.updateTransform()
            var mat = await session.createPhysicallyBasedMaterialResource()
            mat.baseColor.r = 0.4
            mat.baseColor.g = 0.6
            mat.baseColor.b = 0.9
            mat.baseColor.a = 1.0
            mat.metallic.value = 0.0
            mat.roughness.value = 1.0
            await mat.update()
            var customModel = await session.createModelComponent()
            customModel.setMaterials([mat])
            customModel.setMesh(meshResource)
            await e.setComponent(customModel)

            // Handle input
            let v = {
              x: (Math.random() - 0.5) * 0.05,
              y: (Math.random() - 0.5) * 0.05,
              z: (Math.random() - 0.5) * 0.05,
            }
            var input = await session.createInputComponent()
            await e.setComponent(input)
            input.onTranslate = (data: any) => {
              if (data.translate && data.translate.x) {
                v.x = data.translate.x
                v.y = data.translate.y
                v.z = data.translate.z
                e.updateTransform()
              }
            }

            await e.setParent(viewEnt)
            entities.push({ e: e, v: v })
          }
          // Add to the root window component to display
          var wc = await session.getCurrentWindowComponent()
          var ent = await wc.getEntity()
          await viewEnt.setParent(ent!)

          // Watch for updates
          // Keep spatialView positioned where the div is
          var update = () => {
            var rect = (header.current! as HTMLElement).getBoundingClientRect()
            viewEnt.transform.position.x = rect.x + rect.width / 2
            viewEnt.transform.position.y =
              rect.y + rect.height / 2 + window.scrollY
            viewEnt.updateTransform()
            viewEnt
              .getComponent(SpatialViewComponent)!
              .setResolution(rect.width, rect.height)
          }
          var mo = new MutationObserver(update)
          mo.observe(header.current!, { attributes: true })
          var ro = new ResizeObserver(update)
          ro.observe(header.current!)
          const addRemoveObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
              mutation.removedNodes.forEach(node => {
                if (node instanceof HTMLElement) {
                  update()
                }
              })
              mutation.addedNodes.forEach(node => {
                if (node instanceof HTMLElement) {
                  console.log('Element added:', node)
                  update()
                }
              })
            })
          })
          addRemoveObserver.observe(document.body, {
            childList: true,
            subtree: true,
          })
          update()

          // Update loop for entities
          var dt = 0
          var curTime = Date.now() - 60
          var loop = async (_time: DOMHighResTimeStamp) => {
            dt = Date.now() - curTime
            curTime = Date.now()
            if (dt <= 0 || dt > 1000) {
              dt = 60
              console.log('invalid frame delta')
            }

            let w = header.current!.clientWidth
            let h = header.current!.clientHeight
            let wScale = w > h ? w / h : 1.0

            await session!.transaction(() => {
              for (var i = 0; i < entities.length; i++) {
                var entity = entities[i].e
                var timeMultiplier = dt / (1000 / 90)
                entity.transform.position.x += entities[i].v.x * timeMultiplier
                entity.transform.position.y += entities[i].v.y * timeMultiplier
                entity.transform.position.z += entities[i].v.z * timeMultiplier

                entities[i].v.x *= 0.96 * Math.min(timeMultiplier, 1)
                entities[i].v.y *= 0.96 * Math.min(timeMultiplier, 1)
                entities[i].v.z *= 0.96 * Math.min(timeMultiplier, 1)

                if (entity.transform.position.x < -(wScale / 2)) {
                  entity.transform.position.x = -(wScale / 2)
                  entities[i].v.x = Math.abs(entities[i].v.x)
                }
                if (entity.transform.position.x > (wScale / 2)) {
                  entity.transform.position.x = (wScale / 2)
                  entities[i].v.x = -Math.abs(entities[i].v.x)
                }

                if (entity.transform.position.y < -0.3) {
                  entity.transform.position.y = -0.3
                  entities[i].v.y = Math.abs(entities[i].v.y)
                }
                if (entity.transform.position.y > 0.3) {
                  entity.transform.position.y = 0.3
                  entities[i].v.y = -Math.abs(entities[i].v.y)
                }

                if (entity.transform.position.z < -0.3) {
                  entity.transform.position.z = -0.3
                  entities[i].v.z = Math.abs(entities[i].v.z)
                }
                if (entity.transform.position.z > 0.1) {
                  entity.transform.position.z = 0.1
                  entities[i].v.z = -Math.abs(entities[i].v.z)
                }

                entity.updateTransform()
              }
            })
          }
          session!.addOnEngineUpdateEventListener(loop)

        })()
    }
  }, [])

  return (
    <div className={`min-h-screen text-white`}>
      {/* Navigation */}
      <nav className="fixed w-full bg-[#111111] z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <span className="text-xl font-bold">WebSpatial</span>
            <a
              href="/src/docsWebsite?docFile=helloWorld.md"
              className="text-gray-300 hover:text-white"
            >
              Docs
            </a>
            <a
              href="https://github.com/webspatial/webspatial-sdk"
              className="text-gray-300 hover:text-white"
            >
              Github
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          <div ref={header}>
            <div className="bg-[#222222] inline-block px-4 py-1 rounded-full mb-8">
              <span className="text-sm">
                ✨ WebSpatial Alpha is available now! ✨
              </span>
            </div>
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-300 to-blue-500 text-transparent bg-clip-text">
              Ship XR apps with WebSpatial
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Build cross-platform XR apps with JavaScript, React, HTML, and CSS
            </p>
          </div>
          <a href="/src/docsWebsite?docFile=helloWorld.md">
            <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-3 px-8 rounded-full hover:opacity-90 transition duration-300">
              Get Started
            </button>
          </a>

          <div className="mt-16 rounded-xl overflow-hidden bg-[#1A1A1A] border border-gray-800 shadow-2xl max-w-4xl mx-auto">
            {/* Window Header */}
            <div className="bg-[#222222] px-4 py-3 flex items-center">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#28C840]"></div>
              </div>
              <div className="mx-auto text-gray-400 text-sm">Example.jsx</div>
            </div>

            {/* Window Content */}
            <div className="p-6 text-left">
              <pre className="text-sm text-gray-300">
                <code>{`import { Model, SpatialDiv } from '@webspatial/react-sdk'

function App() {
  return (
      <SpatialDiv 
        spatialStyle={{ position: { z: 50 } }} 
        style={{color: "blue"}}>
          <h1>3D UI on XR devices and embeded 3D models</h1>
      </SpatialDiv>
      
      <Model>
        <source
          src="/assets/3DFile.usdz"
          type="model/vnd.usdz+zip" />
        <source
          src="/assets/3DFile.glb"
          type="model/gltf-binary" />
      </Model>
  )
}`}</code>
              </pre>
            </div>
          </div>
          <div className="mt-16 rounded-xl overflow-hidden bg-[#1A1A1A] border border-gray-800 shadow-2xl max-w-4xl mx-auto">
            <div className="p-6 flex flex-col items-center space-y-8">
              <SpatialDiv
                spatialStyle={{ position: { z: 50 } }}
                style={{ color: 'blue-400' }}
              >
                <h1 className="text-xl font-medium">
                  3D UI on XR devices and embeded 3D models
                </h1>
              </SpatialDiv>

              <div className="w-64 h-64 bg-[#2A2A2A] rounded-lg p-4 flex items-center justify-center">
                <Model style={{ width: '200px', height: '200px' }}>
                  <source
                    src="https://raw.githubusercontent.com/webspatial/test-assets/main/kenney/arcade-machine-color.usdz"
                    type="model/vnd.usdz+zip"
                  />
                  <source
                    src="https://raw.githubusercontent.com/webspatial/test-assets/main/kenney/arcade-machine-color.glb"
                    type="model/gltf-binary"
                  />
                </Model>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

document.addEventListener('readystatechange', event => {
  switch (document.readyState) {
    case 'interactive':
      // Initialize react
      var root = document.createElement('div')
      document.body.appendChild(root)
      ReactDOM.createRoot(root).render(
        <App />,
      )

      // Force page height to 100% to get centering to work
      document.documentElement.style.height = '100%'
      document.body.style.height = '100%'
      root.style.height = '100%'

      break
  }
})

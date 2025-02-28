import { SpatialSession, SpatialViewComponent } from '@webspatial/core-sdk'
import { useEffect, useRef } from 'react'
import { showSample } from './sampleLoader'
import { Vec3 } from '@webspatial/core-sdk'

function MySample(props: { session?: SpatialSession }) {
  let divRef = useRef(null)
  useEffect(() => {
    ;(async () => {
      if (props.session) {
        var divOnPage = divRef.current! as HTMLElement
        let session = props.session
        // CODESAMPLE_START
        // Create SpatialView
        var viewEnt = await session.createEntity()
        await viewEnt.setCoordinateSpace('Dom') // Set coordinate space so its transform is relative to the webpage's pixels
        await viewEnt.setComponent(await session.createViewComponent())

        // Create model ent and add as a child to the spatialView
        var box = await session.createMeshResource({ shape: 'box' })
        var mat = await session.createPhysicallyBasedMaterialResource()
        await mat.update()
        var customModel = await session.createModelComponent()
        customModel.setMaterials([mat])
        customModel.setMesh(box)
        var e2 = await session.createEntity()
        await e2.setComponent(customModel)
        e2.transform.position.z = -(0.1 / 2 + 0.00001)
        e2.transform.scale = new Vec3(1920 / 2 / 1360, 1080 / 2 / 1360, 0.1)
        await e2.updateTransform()
        await e2.setParent(viewEnt)

        {
          var box = await session.createMeshResource({ shape: 'sphere' })
          var mat = await session.createPhysicallyBasedMaterialResource()
          await mat.update()
          var customModel = await session.createModelComponent()
          customModel.setMaterials([mat])
          customModel.setMesh(box)
          var e2 = await session.createEntity()
          await e2.setComponent(customModel)

          var input = await session.createInputComponent()
          await e2.setComponent(input)
          input.onTranslate = async data => {
            if (data.eventType == 'dragstart') {
              if (mat.baseColor.r == 1) {
                mat.baseColor.r = 0
              } else {
                mat.baseColor.r = 1
              }
              await mat.update()
            }
          }

          e2.transform.position.y = 0.3
          e2.transform.scale = new Vec3(0.2, 0.2, 0.2)
          await e2.updateTransform()
          await e2.setParent(viewEnt)
        }

        // Load webpage and place in spatialView
        var e3 = await session.createEntity()
        e3.transform.position.x = 0
        e3.transform.position.y = 0.0
        e3.transform.position.z = 0
        e3.transform.scale = new Vec3(2.0, 2.0, 2.0)
        await e3.updateTransform()
        let win = await session.createWindowComponent()
        await Promise.all([
          win.loadURL('http://google.com'),
          win.setResolution(1920 / 4, 1080 / 4),
        ])
        await e3.setComponent(win)
        await e3.setParent(viewEnt)

        // Add to the root window component to display
        var wc = await session.getCurrentWindowComponent()
        var ent = await wc.getEntity()
        await viewEnt.setParent(ent!)

        // Keep spatialView positioned where the div is
        var update = () => {
          var rect = divOnPage.getBoundingClientRect()
          viewEnt.transform.position.x = rect.x + rect.width / 2
          viewEnt.transform.position.y =
            rect.y + rect.height / 2 + window.scrollY
          viewEnt.updateTransform()
          viewEnt
            .getComponent(SpatialViewComponent)!
            .setResolution(rect.width, rect.height)
        }
        var mo = new MutationObserver(update)
        mo.observe(divOnPage, { attributes: true })
        var ro = new ResizeObserver(update)
        ro.observe(divOnPage)
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

        // Resize div onclick to see it resize
        divOnPage.onclick = () => {
          if (divOnPage.style.width == '300px') {
            divOnPage.style.width = '400px'
            divOnPage.style.height = '400px'
          } else {
            divOnPage.style.width = '300px'
            divOnPage.style.height = '300px'
          }
        }
        // CODESAMPLE_END
      }
    })()
  }, [])
  return (
    <div>
      <h1>
        SpatialView lets you add multiple entities to a single volume attached
        to the webpage
      </h1>
      <div
        ref={divRef}
        style={{ width: '300px', height: '300px', backgroundColor: '#bbbbbb' }}
      ></div>
    </div>
  )
}
showSample(MySample)

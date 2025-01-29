import { SpatialViewComponent, StyleParam } from './component'
import { SpatialSession } from './SpatialSession'
import { Vec3 } from './SpatialTransform'

/**
 * Helper class used to quickly add spatial content to standard web pages
 * [Experimental] expect APIs to potentially change in future versions
 */
export class SpatialHelper {
  constructor(public session: SpatialSession) {}

  shape = {
    createShapeEntity: async (shape = 'box') => {
      var box = await this.session.createMeshResource({ shape: shape })
      var mat = await this.session.createPhysicallyBasedMaterialResource()
      await mat.update()

      var customModel = await this.session.createModelComponent()
      customModel.setMaterials([mat])
      customModel.setMesh(box)

      var boxEntity = await this.session.createEntity()
      await boxEntity.setComponent(customModel)
      boxEntity.transform.position.z = 0
      boxEntity.transform.scale = new Vec3(0.5, 0.5, 0.5)
      await boxEntity.updateTransform()
      return boxEntity
    },
  }

  dom = {
    attachSpatialView: async (divOnPage: HTMLElement) => {
      // Create SpatialView
      var viewEnt = await this.session.createEntity()
      await viewEnt.setCoordinateSpace('Dom') // Set coordinate space so its transform is relative to the webpage's pixels
      await viewEnt.setComponent(await this.session.createViewComponent())

      // Add to the root window component to display
      var wc = await this.session.getCurrentWindowComponent()
      var ent = await wc.getEntity()
      await viewEnt.setParent(ent!)

      // Keep spatialView positioned where the div is
      var update = () => {
        var rect = divOnPage.getBoundingClientRect()
        viewEnt.transform.position.x = rect.x + rect.width / 2
        viewEnt.transform.position.y = rect.y + rect.height / 2 + window.scrollY
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
      return {
        entity: viewEnt,
      }
    },
  }

  setBackgroundStyle = async (
    style: StyleParam,
    backgroundColor = '#00000000',
  ) => {
    document.documentElement.style.backgroundColor = backgroundColor
    await this.session!.getCurrentWindowComponent().setStyle(style)
  }
}

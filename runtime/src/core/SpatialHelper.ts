import { SpatialViewComponent, StyleParam } from './component'
import { Spatial } from './Spatial'
import { SpatialSession } from './SpatialSession'
import { Vec3 } from './SpatialTransform'

/**
 * Helper class used to quickly add spatial content to standard web pages
 * [Experimental] expect APIs to potentially change in future versions
 */
export class SpatialHelper {
  private static _instance: SpatialHelper | null = null
  static get instance() {
    if (this._instance) {
      return this._instance
    } else {
      let spatial = new Spatial()
      if (spatial.isSupported()) {
        let session = spatial.requestSession()
        if (session) {
          this._instance = new SpatialHelper(session)
          return this._instance
        }
      }
    }
    return null
  }

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

  navigation = {
    openPanel: async (
      url: string,
      options?: { dimensions: { x: number; y: number } },
    ) => {
      // Create window group
      var wg = await this.session.createWindowGroup('Plain')

      // Create a root entity displaying a webpage
      var ent = await this.session!.createEntity()
      var i = await this.session!.createWindowComponent(wg)
      await i.loadURL(url)
      await ent.setCoordinateSpace('Root')
      await ent.setComponent(i)

      // Add enitity the windowgroup
      await ent.setParentWindowGroup(wg)

      if (options?.dimensions) {
        await wg.setStyle({ dimensions: options.dimensions })
      }
    },
    openVolume: async (
      url: string,
      options?: { dimensions: { x: number; y: number } },
    ) => {
      var wg = await this.session.createWindowGroup('Volumetric')

      // Create a root view entity within the window group
      var rootEnt = await this.session!.createEntity()
      await rootEnt.setComponent(await this.session!.createViewComponent(wg))
      await rootEnt.setCoordinateSpace('Root')
      await rootEnt.setParentWindowGroup(wg)

      // Add webpage to the window group
      var ent = await this.session!.createEntity()
      var i = await this.session!.createWindowComponent(wg)
      await i.loadURL(url)
      if (options?.dimensions) {
        await i.setResolution(options.dimensions.x, options.dimensions.y)
      } else {
        await i.setResolution(1000, 1000)
      }
      ent.transform.position.z = -0.49
      await ent.updateTransform()
      await ent.setCoordinateSpace('App')
      await ent.setComponent(i)
      await ent.setParent(rootEnt)
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

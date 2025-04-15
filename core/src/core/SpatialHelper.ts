import { SpatialViewComponent, StyleParam } from './component'
import { Spatial } from './Spatial'
import { SpatialEntity } from './SpatialEntity'
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
    createModelEntity: async (url: string) => {
      var customModel = await this.session.createModelComponent({ url })
      var boxEntity = await this.session.createEntity()
      await boxEntity.setComponent(customModel)
      await boxEntity.updateTransform()
      return boxEntity
    },
    wrapInBoundingBoxEntity: async (entityToWrap: SpatialEntity) => {
      var bb = await entityToWrap.getBoundingBox()

      // Scale to fit
      var targetSize = 1.0
      var scale =
        targetSize / Math.max(bb.extents.x, bb.extents.y, bb.extents.z)
      entityToWrap.transform.scale.x = scale
      entityToWrap.transform.scale.y = scale
      entityToWrap.transform.scale.z = scale

      // Center within view
      entityToWrap.transform.position.x = -bb.center.x * scale
      entityToWrap.transform.position.y = -bb.center.y * scale
      entityToWrap.transform.position.z = -bb.center.z * scale
      await entityToWrap.updateTransform()

      // wrap in boudning box
      var boudningEntity = await SpatialHelper.instance?.session.createEntity()!
      await entityToWrap.setParent(boudningEntity!)
      return boudningEntity
    },
  }

  navigation = {
    openPanel: async (
      url: string,
      options?: { resolution: { width: number; height: number } },
    ) => {
      if (options?.resolution) {
        await this.session
          .getCurrentWindowContainer()
          ._setOpenSettings({ resolution: options.resolution })
      }

      // Create window container
      var wg = await this.session.createWindowContainer({
        style: 'Plain',
        windowComponent: null,
        windowContainer: null,
      })

      // Create a root entity displaying a webpage
      var ent = await this.session!.createEntity({
        windowComponent: null,
        windowContainer: wg,
      })
      var i = await this.session!.createWindowComponent({
        windowComponent: null,
        windowContainer: wg,
      })
      await i.loadURL(url)
      await ent.setCoordinateSpace('Root')
      await ent.setComponent(i)

      // Add enitity the window container
      await wg.setRootEntity(ent)

      // Restore default size
      await this.session
        .getCurrentWindowContainer()
        ._setOpenSettings({ resolution: { width: 900, height: 700 } })

      return {
        windowContainer: wg,
      }
    },
    openVolume: async (
      url: string,
      options?: { resolution: { width: number; height: number } },
    ) => {
      var wg = await this.session.createWindowContainer({
        style: 'Volumetric',
        windowComponent: null,
        windowContainer: null,
      })

      // Create a root view entity within the window container
      var rootEnt = await this.session!.createEntity({
        windowComponent: null,
        windowContainer: wg,
      })
      await rootEnt.setComponent(
        await this.session!.createViewComponent({
          windowComponent: null,
          windowContainer: wg,
        }),
      )
      await rootEnt.setCoordinateSpace('Root')
      await wg.setRootEntity(rootEnt)

      // Add webpage to the window container
      var ent = await this.session!.createEntity({
        windowComponent: null,
        windowContainer: wg,
      })
      var i = await this.session!.createWindowComponent({
        windowComponent: null,
        windowContainer: wg,
      })
      await i.loadURL(url)
      if (options?.resolution) {
        await i.setResolution(
          options.resolution.width,
          options.resolution.height,
        )
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

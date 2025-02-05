import { SpatialMeshResource } from '../resource/SpatialMeshResource'
import { SpatialPhysicallyBasedMaterialResource } from '../resource/SpatialPhysicallyBasedMaterialResource'
import { SpatialComponent } from './SpatialComponent'
import { WebSpatial } from '../private/WebSpatial'

/**
 * Used to position a model in 3D space, made up of a mesh and materials to be applied to the mesh
 */
export class SpatialModelComponent extends SpatialComponent {
  private cachedMaterials = new Array<SpatialPhysicallyBasedMaterialResource>()
  /**
   * Sets the mesh to be displayed by the component
   * @param mesh mesh to set
   */
  async setMesh(mesh: SpatialMeshResource) {
    await WebSpatial.updateResource(this._resource, {
      meshResource: mesh._resource.id,
    })
  }

  /**
   * Sets the materials that should be applied to the mesh
   * @param materials array of materials to set
   */
  async setMaterials(materials: Array<SpatialPhysicallyBasedMaterialResource>) {
    this.cachedMaterials = materials
    await WebSpatial.updateResource(this._resource, {
      materials: materials.map(m => {
        m._addToComponent(this)
        return m._resource.id
      }),
    })
  }

  /** @hidden */
  async _syncMaterials() {
    await this.setMaterials(this.cachedMaterials)
  }
}

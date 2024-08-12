
import { SpatialMeshResource } from "./SpatialMeshResource"
import { SpatialPhysicallyBasedMaterial } from "./SpatialPhysicallyBasedMaterial"
import { SpatialResource } from "./SpatialResource"
import { WebSpatial } from "./webSpatialPrivate"

/**
* Used to position a model in 3D space, made up of a mesh and materials to be applied to the mesh
*/
export class SpatialModelComponent extends SpatialResource {
    /**
     * Sets the mesh to be displayed by the component
     * @param mesh mesh to set
     */
    async setMesh(mesh: SpatialMeshResource) {
      await WebSpatial.updateResource(this._resource, { meshResource: mesh._resource.id })
    }
  
    /**
     * Sets the materials that should be applied to the mesh
     * @param materials array of materials to set
     */
    async setMaterials(materials: Array<SpatialPhysicallyBasedMaterial>) {
      await WebSpatial.updateResource(this._resource, { materials: materials.map((m) => { return m._resource.id }) })
    }
  }
  
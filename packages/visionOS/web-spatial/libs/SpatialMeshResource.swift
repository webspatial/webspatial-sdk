import Foundation
import RealityKit

@Observable
class SpatialMeshResource: SpatialObject {
    let meshResource: MeshResource

    init(_ meshResource: MeshResource) {
        self.meshResource = meshResource
        super.init()
    }
}

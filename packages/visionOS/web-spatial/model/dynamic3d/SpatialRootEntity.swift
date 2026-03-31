import RealityKit
import SwiftUI

@Observable
class SpatialRootEntity: SpatialEntity {
    weak var root: SpatializedDynamic3DElement?

    convenience init(root: SpatializedDynamic3DElement) {
        self.init()
        self.root = root
    }
}

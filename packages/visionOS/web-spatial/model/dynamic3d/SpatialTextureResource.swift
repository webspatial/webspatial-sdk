import RealityKit
import SwiftUI

@Observable
class SpatialTextureResource: SpatialObject {
    var _resource: TextureResource?
    var resource: TextureResource? {
        _resource
    }

    override init(_ url: String) {
        super.init()
    }

    override func onDestroy() {
        _resource = nil
    }
}

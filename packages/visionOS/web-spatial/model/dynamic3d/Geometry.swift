import RealityKit
import SwiftUI

@Observable
class Geometry: SpatialObject {
    let type: GeometryType

    var _resource: MeshResource?
    var resource: MeshResource? {
        _resource
    }

    init(_ _type: GeometryType) {
        type = _type
        super.init()
    }

    override func onDestroy() {
        _resource = nil
    }
}

@Observable
class BoxGeometry: Geometry {
    let width: Float
    let height: Float
    let depth: Float
    let cornerRadius: Float
    let splitFaces: Bool
    init(width: Float, height: Float, depth: Float, cornerRadius: Float = 0, splitFaces: Bool = false) {
        self.width = width
        self.height = height
        self.depth = depth
        self.cornerRadius = cornerRadius
        self.splitFaces = splitFaces
        super.init(.BoxGeometry)
        _resource = MeshResource.generateBox(width: width, height: height, depth: depth, cornerRadius: cornerRadius, splitFaces: splitFaces)
    }
}

@Observable
class PlaneGeometry: Geometry {
    let width: Float
    let height: Float
    let cornerRadius: Float
    init(width: Float, height: Float, cornerRadius: Float = 0) {
        self.width = width
        self.height = height
        self.cornerRadius = cornerRadius
        super.init(.PlaneGeometry)
        _resource = MeshResource.generatePlane(width: width, height: height, cornerRadius: cornerRadius)
    }
}

enum GeometryType: String {
    case BoxGeometry
    case PlaneGeometry
//    case SphereGeometry = "SphereGeometry"
//    case ConeGeometry = "ConeGeometry"
//    case CylinderGeometry = "CylinderGeometry"
}

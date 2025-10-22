import SwiftUI
import RealityKit

@Observable
class Geometry: SpatialObject {
    let type:GeometryType
    
    internal var _resource:MeshResource? = nil
    var resource:MeshResource? {
        _resource
    }
    
    init(_ _type:GeometryType){
        type = _type
        super.init()
    }
    
    override func onDestroy() {
        _resource = nil
    }
}

@Observable
class BoxGeometry:Geometry{
    let width:Float
    let height:Float
    let depth:Float
    let cornerRadius:Float
    let splitFaces:Bool
    init(width:Float, height:Float, depth:Float, cornerRadius:Float = 0, splitFaces:Bool = false){
        self.width = width
        self.height = height
        self.depth = depth
        self.cornerRadius = cornerRadius
        self.splitFaces = splitFaces
        super.init(.BoxGeometry)
        _resource = MeshResource.generateBox(width: width, height: height, depth: depth, cornerRadius: cornerRadius, splitFaces: splitFaces)
    }
}

enum GeometryType: String{
    case BoxGeometry = "BoxGeometry"
//    case PlaneGeometry = "PlaneGeometry"
//    case SphereGeometry = "SphereGeometry"
//    case ConeGeometry = "ConeGeometry"
//    case CylinderGeometry = "CylinderGeometry"
}

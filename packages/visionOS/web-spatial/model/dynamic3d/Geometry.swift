import SwiftUI
import RealityKit

@Observable
class Geometry: SpatialObjectProtocol, EventEmitterProtocol {
    let spatialId: String
    var name:String = ""
    let id: String
    
    private var _isDestroyed: Bool = false
    var isDestroyed: Bool {
        return _isDestroyed
    }
    internal var listeners: [String: [(_ object: Any, _ data: Any) -> Void]] = [:]
    
    internal var _resource:MeshResource? = nil
    var resource:MeshResource? {
        _resource
    }
    let type:GeometryType
    
    init(_ _type:GeometryType){
        spatialId = UUID().uuidString
        id = spatialId
        type = _type
        SpatialObject.objects[spatialId] = self
        SpatialObjectWeakRefManager.setWeakRef(spatialId, self)
    }
    
    // Encodable
    enum CodingKeys: String, CodingKey {
        case id, name, isDestroyed
    }
    
    func encode(to encoder: any Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(spatialId, forKey: .id)
        try container.encode(name, forKey: .name)
        try container.encode(isDestroyed, forKey: .isDestroyed)
    }
    
    // Equatable
    static func == (lhs: Geometry, rhs: Geometry) -> Bool {
        return lhs.spatialId == rhs.spatialId
    }
    
    // Destroy
    enum Events: String {
        case BeforeDestroyed = "Geometry::BeforeDestroyed"
        case Destroyed = "Geometry::Destroyed"
    }
    
    func destroy() {
        if _isDestroyed {
            print("SpatialEntity already destroyed \(self)")
            return
        }
        emit(event: Events.BeforeDestroyed.rawValue, data: ["object": self])
        onDestroy()
        _isDestroyed = true

        emit(event: Events.Destroyed.rawValue, data: ["object": self])
        listeners = [:]
        
    }
    
    func onDestroy() {
        
    }
}

@Observable
class BoxGeometry:Geometry{
    let width:Float
    let height:Float
    let depth:Float
    let cornerRadius:Float
    let splitFaces:Bool
    required init(width:Float, height:Float, depth:Float, cornerRadius:Float = 0, splitFaces:Bool = false){
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
    case PlaneGeometry = "PlaneGeometry"
    case SphereGeometry = "SphereGeometry"
    case ConeGeometry = "ConeGeometry"
    case CylinderGeometry = "CylinderGeometry"
}

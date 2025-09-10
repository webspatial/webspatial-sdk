import Foundation

protocol SpatialObjectProtocol: Encodable, Equatable {
    var spatialId: String { get }
    var name: String { get set }
    var isDestroyed: Bool { get }
    
    func destroy()
    func onDestroy()
}

class WeakReference<T: AnyObject> {
    weak var value: T?

    init(_ value: T) {
        self.value = value
    }
}

class SpatialObjectWeakRefManager {
    static var weakRefObjects = [String: WeakReference<AnyObject>]()
    
    static func setWeakRef<T: AnyObject>(_ id: String, _ object: T) {
        weakRefObjects[id] = WeakReference(object as AnyObject)
    }
    
    static func getWeakRef(_ id: String) -> AnyObject? {
        return weakRefObjects[id]?.value
    }
    
    static func removeWeakRef(_ id: String) {
        weakRefObjects.removeValue(forKey: id)
    }
}

class SpatialObject: EventEmitter, Encodable, Equatable, SpatialObjectProtocol {
    static var objects = [String: (any SpatialObjectProtocol)]()
    
    static func get(_ id: String) -> (any SpatialObjectProtocol)? {
        return objects[id]
    }

    static func getRefObject(_ id: String) -> SpatialObject? {
        return SpatialObjectWeakRefManager.getWeakRef(id) as? SpatialObject
    }

    let spatialId: String
    var name: String = ""
    let id: String

    private var _isDestroyed = false

    var isDestroyed: Bool {
        _isDestroyed
    }

    enum CodingKeys: String, CodingKey {
        case id, name, isDestroyed
    }

    func encode(to encoder: any Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(spatialId, forKey: .id)
        try container.encode(name, forKey: .name)
        try container.encode(isDestroyed, forKey: .isDestroyed)
    }

    static func == (lhs: SpatialObject, rhs: SpatialObject) -> Bool {
        return lhs.spatialId == rhs.spatialId
    }

    override init() {
        spatialId = UUID().uuidString
        id = spatialId
        super.init()
        SpatialObject.objects[spatialId] = self
        SpatialObjectWeakRefManager.setWeakRef(spatialId, self)
    }

    init(_ _id: String) {
        spatialId = _id
        id = spatialId
        super.init()
        SpatialObject.objects[spatialId] = self
        SpatialObjectWeakRefManager.setWeakRef(spatialId, self)
    }

    deinit {
        SpatialObjectWeakRefManager.removeWeakRef(spatialId)
    }

    enum Events: String {
        case BeforeDestroyed = "SpatialObject::BeforeDestroyed"
        case Destroyed = "SpatialObject::Destroyed"
    }

    func destroy() {
        if _isDestroyed {
            logger.warning("SpatialObject already destroyed \(self)")
            return
        }
        emit(event: Events.BeforeDestroyed.rawValue, data: ["object": self])
        onDestroy()
        _isDestroyed = true

        emit(event: Events.Destroyed.rawValue, data: ["object": self])
        SpatialObject.objects.removeValue(forKey: spatialId)

        reset()
    }

    func onDestroy() {}
}

import Foundation

protocol SpatialObjectProtocol: Encodable, Equatable, EventEmitterProtocol {
    var spatialId: String { get }
    func destroy()
}

class WeakReference<T: AnyObject> {
    weak var value: T?

    init(_ value: T) {
        self.value = value
    }
}

class SpatialObjectWeakRefManager {
    static var weakRefObjects = [String: WeakReference<AnyObject>]()
    private static let serialQueue = DispatchQueue(label: "com.xrsdk.spatialObjectWeakRefQueue")

    static func setWeakRef<T: AnyObject>(_ id: String, _ object: T) {
        serialQueue.sync {
            weakRefObjects[id] = WeakReference(object as AnyObject)
        }
    }

    static func getWeakRef(_ id: String) -> AnyObject? {
        serialQueue.sync {
            weakRefObjects[id]?.value
        }
    }

    static func removeWeakRef(_ id: String) {
        serialQueue.sync {
            weakRefObjects.removeValue(forKey: id)
        }
    }
}

class SpatialObject: SpatialObjectProtocol {
    var listeners: [String: [(Any, Any) -> Void]] = [:]
    static var objects = [String: any SpatialObjectProtocol]()
    private static let serialQueue = DispatchQueue(label: "com.xrsdk.spatialObjectQueue")

    static func get(_ id: String) -> (any SpatialObjectProtocol)? {
        serialQueue.sync {
            objects[id]
        }
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

    init() {
        spatialId = UUID().uuidString
        id = spatialId
        SpatialObject.serialQueue.sync {
            SpatialObject.objects[spatialId] = self
        }
        SpatialObjectWeakRefManager.setWeakRef(spatialId, self)
    }

    init(_ _id: String) {
        spatialId = _id
        id = spatialId
        SpatialObject.serialQueue.sync {
            SpatialObject.objects[spatialId] = self
        }
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
        SpatialObject.serialQueue.sync {
            SpatialObject.objects.removeValue(forKey: spatialId)
        }

        listeners = [:]
    }

    func onDestroy() {}
}

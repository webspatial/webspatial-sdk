import Foundation

class WeakReference<T: AnyObject> {
    weak var value: T?

    init(_ value: T) {
        self.value = value
    }
}

class SpatialObject: EventEmitter, Encodable, Equatable {
    static var objects = [String: SpatialObject]()
    static var weakRefObjects = [String: WeakReference<SpatialObject>]()
    static func get(_ id: String) -> SpatialObject? {
        return objects[id]
    }

    static func getRefObject(_ id: String) -> SpatialObject? {
        return weakRefObjects[id]?.value
    }

    static func getWeakRef(_ id: String) -> SpatialObject? {
        return weakRefObjects[id]?.value
    }

    let id: String
    var name: String = ""

    private var _isDestroyed = false

    var isDestroyed: Bool {
        _isDestroyed
    }

    enum CodingKeys: String, CodingKey {
        case id, name, isDestroyed
    }

    func encode(to encoder: any Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(name, forKey: .name)
        try container.encode(isDestroyed, forKey: .isDestroyed)
    }

    static func == (lhs: SpatialObject, rhs: SpatialObject) -> Bool {
        return lhs.id == rhs.id
    }

    override init() {
        id = UUID().uuidString
        super.init()
        SpatialObject.objects[id] = self
        SpatialObject.weakRefObjects[id] = WeakReference(self)
    }

    init(_ _id: String) {
        id = _id
        super.init()
        SpatialObject.objects[id] = self
        SpatialObject.weakRefObjects[id] = WeakReference(self)
    }

    deinit {
        SpatialObject.weakRefObjects.removeValue(forKey: id)
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
        SpatialObject.objects.removeValue(forKey: id)

        reset()
    }

    func onDestroy() {}
}

import Foundation

struct SpatialObjectInfo: Codable {
    var count: Int
    var windowArray: [String]
    var windowContainerArray: [String]
    var entityArray: [String]
}

// Stats from native code. Objects tracks number of native objects that were created but not yet explicitly destroyed. RefObjects tracks bjects that still have references. After an object is destroyed, we should be cleaning up all of the native references. Expect objects.count == refObjects.count , if not, there is likely a leak.
struct SpatialObjectStatsInfo: Codable {
    var backend = "AVP"
    var objects: SpatialObjectInfo
    var refObjects: SpatialObjectInfo
    var perfStats: PerfStats
}

class WeakReference<T: AnyObject> {
    weak var value: T?

    init(_ value: T) {
        self.value = value
    }
}

class SpatialObject: EventEmitter, Equatable {
    static var objects = [String: SpatialObject]()
    static var weakRefObjects = [String: WeakReference<SpatialObject>]()
    static func get(_ id: String) -> SpatialObject? {
        return objects[id]
    }

    static func getRefObject(_ id: String) -> SpatialObject? {
        return weakRefObjects[id]?.value
    }

    // for debug
    static func stats() -> SpatialObjectStatsInfo {
        let webviews = objects.filter {
            $0.value is SpatialWindowComponent
        }

        let entities = objects.filter {
            $0.value is SpatialEntity
        }

        let windowContainers = objects.filter {
            $0.value is SpatialWindowContainer
        }

        let weakRefWebviews = weakRefObjects.filter {
            $0.value.value is SpatialWindowComponent
        }

        let weakRefWindowContainers = weakRefObjects.filter {
            $0.value.value is SpatialWindowContainer
        }

        let weakRefEntities = weakRefObjects.filter {
            $0.value.value is SpatialEntity
        }

        return SpatialObjectStatsInfo(
            objects: SpatialObjectInfo(
                count: objects.count,
                windowArray: Array(webviews.keys),
                windowContainerArray: Array(windowContainers.keys),
                entityArray: Array(entities.keys)
            ),
            refObjects: SpatialObjectInfo(
                count: weakRefObjects.count,
                windowArray: Array(weakRefWebviews.keys),
                windowContainerArray: Array(weakRefWindowContainers.keys),
                entityArray: Array(weakRefEntities.keys)
            ),
            perfStats: clock.perfStats
        )
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

    func inspect() -> [String: Any] {
        return ["id": id, "isDestroyed": isDestroyed, "name": name]
    }
}

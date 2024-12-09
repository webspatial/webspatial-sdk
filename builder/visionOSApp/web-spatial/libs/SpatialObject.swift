//
//  SpatialObject.swift
//  web-spatial
//
//  Created by ByteDance on 9/10/24.
//

import Foundation

struct SpatialObjectInfo: Codable {
    var count: Int
    var windowArray: [String]
    var windowGroupArray: [String]
    var entityArray: [String]
}

struct SpatialObjectStatsInfo: Codable {
    var backend = "AVP"
    var objects: SpatialObjectInfo
    var refObjects: SpatialObjectInfo
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

        let windowGroups = objects.filter {
            $0.value is SpatialWindowGroup
        }

        let weakRefWebviews = weakRefObjects.filter {
            $0.value.value is SpatialWindowComponent
        }

        let weakRefWindowGroups = weakRefObjects.filter {
            $0.value.value is SpatialWindowGroup
        }

        let weakRefEntities = weakRefObjects.filter {
            $0.value.value is SpatialEntity
        }

        return SpatialObjectStatsInfo(
            objects: SpatialObjectInfo(
                count: objects.count,
                windowArray: Array(webviews.keys),
                windowGroupArray: Array(windowGroups.keys),
                entityArray: Array(entities.keys)
            ),
            refObjects: SpatialObjectInfo(
                count: weakRefObjects.count,
                windowArray: Array(weakRefWebviews.keys),
                windowGroupArray: Array(weakRefWindowGroups.keys),
                entityArray: Array(weakRefEntities.keys)
            )
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
            print("SpatialObject already destroyed", self)
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

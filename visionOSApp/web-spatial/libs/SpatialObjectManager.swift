//
//  SpatialObjectManager.swift
//  web-spatial
//
//  Created by ByteDance on 9/10/24.
//

// import Foundation

struct StatsInfo {
    var spatialObjectCount: Int
    var destroyedObjectCount: Int
    var webviewCount: Int
}

class SpatialObjectManager {
    private var allSpatialObjects = [String: SpatialObject]()

    public func add(_ spatiaoObject: SpatialObject) {
        allSpatialObjects[spatiaoObject.id] = spatiaoObject
    }

    public func remove(_ spatiaoObject: SpatialObject) {
        allSpatialObjects.removeValue(forKey: spatiaoObject.id)
    }

    public func get(_ id: String) -> SpatialObject? {
        return allSpatialObjects[id]
    }

    public func stats() -> StatsInfo {
        let spatialObjectCount = allSpatialObjects.count
        let destroyedObjectCount = allSpatialObjects.filter {
            $0.value.isDestroyed
        }.count
        let webviewCount = allSpatialObjects.filter {
            $0.value is SpatialWindowComponent
        }.count
        return StatsInfo(spatialObjectCount: spatialObjectCount, destroyedObjectCount: destroyedObjectCount, webviewCount: webviewCount)
    }
}

let gSpatialObjectManager = SpatialObjectManager()

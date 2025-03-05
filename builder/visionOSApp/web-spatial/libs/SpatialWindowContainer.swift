//
//  SpatialWindowContainer.swift
//  web-spatial
//
//  Created by ByteDance on 9/10/24.
//

import Combine
import Foundation
import RealityKit
import typealias RealityKit.Entity

@Observable
class SpatialWindowContainer: SpatialObject {
    // save active plain windowContainer ids
    static var activePlainWindowContainerIds: Set<String> = []
	// get first active plain WindowContainerId
    static var firstActivePlainWindowContainerId: String? {
        return activePlainWindowContainerIds.first
    }

    // Resources that will be destroyed when this window group is removed
    private var childResources = [String: SpatialObject]()
    public var childContainers = [String: SpatialWindowContainer]()

    var wgd: WindowContainerData
    static func getSpatialWindowContainer(_ name: String) -> SpatialWindowContainer? {
        return SpatialObject.get(name) as? SpatialWindowContainer
    }

    static func getOrCreateSpatialWindowContainer(_ name: String, _ data: WindowContainerData) -> SpatialWindowContainer? {
        if let windowContainer = getSpatialWindowContainer(name) {
            return windowContainer
        }
        let newWindowContainer = SpatialWindowContainer(name, data)
        return newWindowContainer
    }

    init(_ name: String, _ data: WindowContainerData) {
        wgd = data
        if data.windowStyle == "Plain" {
            SpatialWindowContainer.activePlainWindowContainerIds.insert(data.windowContainerID)
        }

        super.init(name)
    }

    // Resources
    private var childEntities = [String: SpatialEntity]()

    public func getEntities() -> [String: SpatialEntity] {
        return childEntities
    }

    public func addEntity(_ spatialEntity: SpatialEntity) {
        childEntities[spatialEntity.id] = spatialEntity
    }

    public func removeEntity(_ spatialEntity: SpatialEntity) {
        childEntities.removeValue(forKey: spatialEntity.id)
    }

    // Global state
    var toggleImmersiveSpace = PassthroughSubject<Bool, Never>()

    var setSize = PassthroughSubject<CGSize, Never>()

    var updateFrame = false
    var openWindowData = PassthroughSubject<WindowContainerData, Never>()
    var closeWindowData = PassthroughSubject<WindowContainerData, Never>()

    var setLoadingWindowData = PassthroughSubject<LoadingWindowContainerData, Never>()

    override func onDestroy() {
        childEntities.forEach { $0.value.destroy() }
        childEntities = [:]

        // Destroy resources
        let spatialObjects = childResources.map { $0.value }
        for spatialObject in spatialObjects {
            spatialObject.destroy()
        }
        childResources = [String: SpatialObject]()

        // Destroy spatial containers
        let spatialContainers = childContainers.map { $0.value }
        for spatialObject in spatialContainers {
            if spatialObject != self {
                spatialObject.destroy()
            }
        }
        childContainers = [String: SpatialWindowContainer]()

        // Close the window group when this object is destroyed
        SpatialWindowContainer.getSpatialWindowContainer(id)!.closeWindowData.send(wgd)
        if wgd.windowStyle == "Plain" {
            SpatialWindowContainer.activePlainWindowContainerIds.remove(wgd.windowContainerID)
        }
    }

    override func inspect() -> [String: Any] {
        let childEntitiesInfo = childEntities.mapValues { entity in
            entity.inspect()
        }

        let baseInspectInfo = super.inspect()
        var inspectInfo: [String: Any] = ["childEntities": childEntitiesInfo]
        for (key, value) in baseInspectInfo {
            inspectInfo[key] = value
        }
        return inspectInfo
    }
}

extension SpatialWindowContainer {
    private static let RootID = "root"
    static func getRootID() -> String {
        return RootID
    }

    static func createRootWindowContainer() -> SpatialWindowContainer {
        if let rootWindowContainer = getSpatialWindowContainer(RootID) {
            logger.warning("Root already created! ")
            return rootWindowContainer
        }
        let wgd = WindowContainerData(windowStyle: "Plain", windowContainerID: "root")
        return SpatialWindowContainer(RootID, wgd)
    }
}

extension SpatialWindowContainer {
    private static let ImmersiveID = "Immersive"

    static func getImmersiveWindowContainer() -> SpatialWindowContainer {
        return getSpatialWindowContainer(ImmersiveID)!
    }

    static func createImmersiveWindowContainer() -> SpatialWindowContainer {
        if let windowContainer = getSpatialWindowContainer(ImmersiveID) {
            logger.warning("Immersive already created! ")
            return windowContainer
        }
        let wgd = WindowContainerData(windowStyle: "ImmersiveSpace", windowContainerID: "ImmersiveSpace")
        return SpatialWindowContainer(ImmersiveID, wgd)
    }
}

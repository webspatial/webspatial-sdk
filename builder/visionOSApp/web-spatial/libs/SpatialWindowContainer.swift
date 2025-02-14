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
    var wgd: WindowContainerData? = nil
    static func getSpatialWindowContainer(_ name: String) -> SpatialWindowContainer? {
        return SpatialObject.get(name) as? SpatialWindowContainer
    }

    static func getOrCreateSpatialWindowContainer(_ name: String) -> SpatialWindowContainer? {
        if let windowContainer = getSpatialWindowContainer(name) {
            return windowContainer
        }
        let newWindowContainer = SpatialWindowContainer(name)
        return newWindowContainer
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
            print("Root already created! ")
            return rootWindowContainer
        }
        return SpatialWindowContainer(RootID)
    }
}

extension SpatialWindowContainer {
    private static let ImmersiveID = "Immersive"

    static func getImmersiveWindowContainer() -> SpatialWindowContainer {
        return getSpatialWindowContainer(ImmersiveID)!
    }

    static func createImmersiveWindowContainer() -> SpatialWindowContainer {
        if let windowContainer = getSpatialWindowContainer(ImmersiveID) {
            print("Immersive already created! ")
            return windowContainer
        }
        return SpatialWindowContainer(ImmersiveID)
    }
}

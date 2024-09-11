//
//  SpatialWindowGroup.swift
//  web-spatial
//
//  Created by ByteDance on 9/10/24.
//

import Combine
import Foundation
import RealityKit
import typealias RealityKit.Entity

@Observable
class SpatialWindowGroup: SpatialObject {
    static var windowGroups = [String: SpatialWindowGroup]()
    static func getSpatialWindowGroup(_ name: String) -> SpatialWindowGroup? {
        return windowGroups[name]
    }

    static func getOrCreateSpatialWindowGroup(_ name: String) -> SpatialWindowGroup? {
        if let windowGroup = windowGroups[name] {
            return windowGroup
        }
        let newWindowGroup = SpatialWindowGroup(name)
        return newWindowGroup
    }

    let name: String

    // Resources
    var childEntities = [String: SpatialEntity]()

    // Global state
    var toggleImmersiveSpace = PassthroughSubject<Bool, Never>()

    var setSize = PassthroughSubject<CGSize, Never>()

    var updateFrame = false
    var openWindowData = PassthroughSubject<WindowGroupData, Never>()
    var closeWindowData = PassthroughSubject<WindowGroupData, Never>()

    init(_ name: String) {
        self.name = name
        super.init()

        SpatialWindowGroup.windowGroups[name] = self
    }

    deinit {
        SpatialWindowGroup.windowGroups.removeValue(forKey: name)
    }
}

extension SpatialWindowGroup {
    private static let RootID = "root"
    static func getRootWindowGroup() -> SpatialWindowGroup {
        return getSpatialWindowGroup(RootID)!
    }

    static func createRootWindowGroup() -> SpatialWindowGroup {
        if let rootWindowGroup = getSpatialWindowGroup(RootID) {
            print("Root already created! ")
            return rootWindowGroup
        }
        return SpatialWindowGroup(RootID)
    }
}

extension SpatialWindowGroup {
    private static let ImmersiveID = "Immersive"

    static func getImmersiveWindowGroup() -> SpatialWindowGroup {
        return getSpatialWindowGroup(ImmersiveID)!
    }

    static func createImmersiveWindowGroup() -> SpatialWindowGroup {
        if let windowGroup = getSpatialWindowGroup(ImmersiveID) {
            print("Immersive already created! ")
            return windowGroup
        }
        return SpatialWindowGroup(ImmersiveID)
    }
}

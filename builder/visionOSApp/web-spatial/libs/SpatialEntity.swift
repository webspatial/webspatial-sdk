//
//  SpatialEntity.swift
//  web-spatial
//
//  Created by ByteDance on 9/10/24.
//

import Combine
import Foundation
import RealityKit
import typealias RealityKit.Entity

enum CoordinateSpaceMode {
    case
        APP,
        DOM,
        ROOT

    var description: String {
        switch self {
        case .APP:
            return "APP"
        case .DOM:
            return "DOM"
        case .ROOT:
            return "ROOT"
        }
    }
}

// temp use SpatialBridgeComponent,
//  will be replaced when modelEntity is removed from SpatialEntity
//  then SpatialEntity have have a BridgeEntity instead
class SpatialBridgeComponent: Component {
    let spatialEntity: SpatialEntity

    init(_ spatialEntity: SpatialEntity) {
        self.spatialEntity = spatialEntity
    }
}

// Entity
@Observable
class SpatialEntity: SpatialObject {
    var coordinateSpace = CoordinateSpaceMode.APP
    let modelEntity = ModelEntity()
    var zIndex: Double = 0

    var forceUpdate = false

    override init() {
        super.init()
        modelEntity.components.set(SpatialBridgeComponent(self))
        modelEntity.model = ModelComponent(mesh: .generateBox(size: 0.0), materials: [])
    }

    // Entity can have a child/parent relationship
    private var childEntities = [String: SpatialEntity]()
    weak var parent: SpatialEntity? = nil

    public func getEntities() -> [String: SpatialEntity] {
        return childEntities
    }

    // Window group that this entity will be displayed in (not related to resource ownership)
    weak var parentWindowGroup: SpatialWindowGroup?
    public func setParentWindowGroup(wg: SpatialWindowGroup?) {
        if let g = parentWindowGroup {
            g.removeEntity(self)
            parentWindowGroup = nil
        }
        parentWindowGroup = wg
        if let g = parentWindowGroup {
            g.addEntity(self)
        }

        // @Trevor: I add this code to process parent
        //          I think an entity can be either child of WindowGroup or SpatialEntity
        parent?.childEntities.removeValue(forKey: id)
        parent = nil
    }

    public func addChild(child: SpatialEntity) {
        child.setParent(parentEnt: self)
    }

    public func setParent(parentEnt: SpatialEntity?) {
        // Remove parent windowGroup
        parentWindowGroup?.removeEntity(self)
        parentWindowGroup = nil

        // Remove from existing parent
        parent?.childEntities.removeValue(forKey: id)

        // Set new parent
        if let p = parentEnt {
            parent = p
            p.childEntities[id] = self
        }
    }

    // components
    private var components: [SpatialComponent] = []

    public func addComponent(_ component: SpatialComponent) {
        // first check component type
        components.append(component)
        component.entity = self
        component.onAddToEntity()
    }

    public func removeComponent(_ component: SpatialComponent) {
        if let index = components.firstIndex(of: component) {
            components.remove(at: index)
            component.entity = nil
        }
    }

    public func getComponent<T: SpatialComponent>(_ type: T.Type) -> T? {
        for component in components {
            if let specificComponent = component as? T {
                return specificComponent
            }
        }
        return nil
    }

    public func hasComponent<T: SpatialComponent>(_ type: T.Type) -> Bool {
        return getComponent(type) != nil
    }

    override func onDestroy() {
        if let wg = parentWindowGroup {
            wg.removeEntity(self)
        }

        // handle components destroy
        components.forEach { $0.destroy() }
        components = []

        setParent(parentEnt: nil)
        let keys = childEntities.map { $0.key }
        for k in keys {
            childEntities[k]!.setParent(parentEnt: nil)
        }
        childEntities = [String: SpatialEntity]()

        modelEntity.removeFromParent()
        modelEntity.components.removeAll()
    }

    override func inspect() -> [String: Any] {
        let childEntitiesInfo = childEntities.mapValues { entity in
            entity.inspect()
        }
        let componentsInfo = components.map { $0.inspect() }

        var inspectInfo: [String: Any] = [
            "position": modelEntity.position.description,
            "scale": modelEntity.scale.description,
            "zIndex": zIndex,
            "childEntities": childEntitiesInfo,
            "coordinateSpace": coordinateSpace.description,
            "parent": parent?.id,
            "parentWindowGroup": parentWindowGroup?.id,
            "components": componentsInfo,
        ]

        let baseInspectInfo = super.inspect()
        for (key, value) in baseInspectInfo {
            inspectInfo[key] = value
        }
        return inspectInfo
    }
}

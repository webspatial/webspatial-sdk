import _RealityKit_SwiftUI
import Foundation
import RealityKit

@Observable
class SpatializedDynamic3DElement: SpatializedElement {
    private var rootEntity = SpatialRootEntity()
    private var viewContent: RealityViewContent? = nil

    override init() {
        super.init()
        rootEntity.root = self
    }

    func getRoot() -> SpatialEntity {
        return rootEntity
    }

    func addEntity(_ entity: SpatialEntity) {
        rootEntity.addChild(entity)
    }

    func removeEntity(_ entity: SpatialEntity) {
        rootEntity.removeChild(entity)
    }

    func getViewContent() -> RealityViewContent? {
        return viewContent
    }

    func setViewContent(_ content: RealityViewContent?) {
        viewContent = content
    }

    enum CodingKeys: String, CodingKey {
        case type, root
    }

    override func encode(to encoder: Encoder) throws {
        try super.encode(to: encoder)
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(SpatializedElementType.SpatializedDynamic3DElement, forKey: .type)
        try container.encode(rootEntity, forKey: .root)
    }

    override func onDestroy() {
        viewContent = nil
        rootEntity.destroy()
        super.onDestroy()
    }
}

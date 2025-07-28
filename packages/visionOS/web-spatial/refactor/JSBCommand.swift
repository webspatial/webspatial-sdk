import SwiftUI

class UpdateSpatialSceneMaterialCommand: CommandDataProtocol {
    static let commandType: String = "updateSpatialSceneMaterial"
    let material: BackgroundMaterial
}

class UpdateSpatialSceneCorerCommand: CommandDataProtocol {
    static let commandType: String = "updateSpatialSceneCorner"
    let cornerRadius: CornerRadius
}

class AddSpatializedElementToSpatialScene: CommandDataProtocol {
    static let commandType: String = "AddSpatializedElementToSpatialScene"
    let spatializedElementId: String
}

class PingCommand: CommandDataProtocol {
    static let commandType: String = "ping"
}

class UpdateSpatializedElementProperties: CommandDataProtocol {
    static let commandType: String = "updateSpatializedElementProperties"
    let id: String
    let width: Double?
    let height: Double?
    let backOffset: Double?
    let rotationAnchor: Vec3?
    let opacity: Double?
    let visible: Bool?
    let scrollWithParent: Bool?
    let zIndex: Double?
}

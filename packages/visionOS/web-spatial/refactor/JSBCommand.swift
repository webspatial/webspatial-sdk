import SwiftUI

class UpdateSpatialSceneMaterial: CommandDataProtocol {
    static let commandType: String = "UpdateSpatialSceneMaterial"
    let material: BackgroundMaterial
}

class UpdateSpatialSceneCorer: CommandDataProtocol {
    static let commandType: String = "UpdateSpatialSceneCorer"
    let cornerRadius: CornerRadius
}

class AddSpatializedElementToSpatialScene: CommandDataProtocol {
    static let commandType: String = "AddSpatializedElementToSpatialScene"
    let spatializedElementId: String
}

class PingCommand: CommandDataProtocol {
    static let commandType: String = "Ping"
}

class UpdateSpatializedElementProperties: CommandDataProtocol {
    static let commandType: String = "UpdateSpatializedElementProperties"
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

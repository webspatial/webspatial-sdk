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

protocol SpatialObjectCommand: CommandDataProtocol {
    var id: String { get }
}

class UpdateSpatializedElementProperties: SpatialObjectCommand {
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

class UpdateSpatializedElementTransform: SpatialObjectCommand {
    static let commandType: String = "UpdateSpatializedElementTransform"
    let id: String
    let position: Vec3?
    let quaternion: Vec4?
    let scale: Vec3?
}

struct ReplyData: Codable {
    var success: Bool
    var code: ReplyCode?
    var message: String?
}

enum ReplyCode: Codable {
    case TypeError
    case CommandError
    case InvalidSpatialObject
}

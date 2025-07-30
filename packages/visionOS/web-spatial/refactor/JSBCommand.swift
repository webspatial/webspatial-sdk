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

protocol SpatializedElementProperties {
    var id: String { get }
    var width: Double? { get }
    var height: Double? { get }
    var backOffset: Double? { get }
    var rotationAnchor: Vec3? { get }
    var opacity: Double? { get }
    var visible: Bool? { get }
    var scrollWithParent: Bool? { get }
    var zIndex: Double? { get }
}

class UpdateSpatialized2DElementProperties: SpatialObjectCommand, SpatializedElementProperties {
    static let commandType: String = "UpdateSpatialized2DElementProperties"
    // implement SpatializedElementProperties Protocol
    let id: String
    let width: Double?
    let height: Double?
    let backOffset: Double?
    let rotationAnchor: Vec3?
    let opacity: Double?
    let visible: Bool?
    let scrollWithParent: Bool?
    let zIndex: Double?
    // Extra Properties
    let scrollEnabled: Bool?
}

class UpdateSpatializedElementTransform: SpatialObjectCommand {
    static let commandType: String = "UpdateSpatializedElementTransform"
    let id: String
    let position: Vec3?
    let quaternion: Vec4?
    let scale: Vec3?
}

class UpdateSpatialized2DElementMaterial: SpatialObjectCommand {
    static let commandType: String = "UpdateSpatialized2DElementMaterial"
    let id: String
    let material: BackgroundMaterial
}

class UpdateSpatialized2DElementCorner: SpatialObjectCommand {
    static let commandType: String = "UpdateSpatialized2DElementCorner"
    let id: String
    let cornerRadius: CornerRadius
}

class AddSpatializedElementToSpatialized2DElement: SpatialObjectCommand {
    static let commandType: String = "AddSpatializedElementToSpatialized2DElement"
    let id: String
    let spatializedElementId: String
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

class UpdateSceneConfigCommand: CommandDataProtocol {
    static let commandType = "UpdateSceneConfig"
    let config: WindowContainerOptions
    init(_ data: WindowContainerOptions) {
        config = data
    }
}

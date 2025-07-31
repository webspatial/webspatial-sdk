import SwiftUI

class UpdateSpatialSceneProperties: CommandDataProtocol {
    static let commandType: String = "UpdateSpatialSceneProperties"
    let cornerRadius: CornerRadius?
    let material: BackgroundMaterial?
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
    let material: BackgroundMaterial?
    let cornerRadius: CornerRadius?
}

class UpdateSpatializedElementTransform: SpatialObjectCommand {
    static let commandType: String = "UpdateSpatializedElementTransform"
    let id: String
    let position: Vec3?
    let quaternion: Vec4?
    let scale: Vec3?
}

class AddSpatializedElementToSpatialized2DElement: SpatialObjectCommand {
    static let commandType: String = "AddSpatializedElementToSpatialized2DElement"
    let id: String
    let spatializedElementId: String
}

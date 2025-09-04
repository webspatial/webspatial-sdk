import SwiftUI

struct UpdateSpatialSceneProperties: CommandDataProtocol {
    static let commandType: String = "UpdateSpatialSceneProperties"
    let cornerRadius: CornerRadius?
    let material: BackgroundMaterial?
    let opacity: Double?
}

struct AddSpatializedElementToSpatialScene: CommandDataProtocol {
    static let commandType: String = "AddSpatializedElementToSpatialScene"
    let spatializedElementId: String
}

struct CreateSpatializedStatic3DElement: CommandDataProtocol {
    static let commandType: String = "CreateSpatializedStatic3DElement"
    let modelURL: String
}

struct InspectCommand: CommandDataProtocol {
    static let commandType: String = "Inspect"
    var id: String?
}

protocol SpatialObjectCommand: CommandDataProtocol {
    var id: String { get }
}

struct DestroyCommand: CommandDataProtocol {
    static let commandType: String = "Destroy"
    var id: String
}

protocol SpatializedElementProperties: SpatialObjectCommand {
    var name: String? { get }
    var width: Double? { get }
    var height: Double? { get }
    var depth: Double? { get }
    var backOffset: Double? { get }
    var rotationAnchor: Vec3? { get }
    var opacity: Double? { get }
    var visible: Bool? { get }
    var scrollWithParent: Bool? { get }
    var zIndex: Double? { get }
    var enableGesture: Bool? { get }
}

struct UpdateSpatialized2DElementProperties: SpatializedElementProperties {
    static let commandType: String = "UpdateSpatialized2DElementProperties"
    let id: String
    let name: String?
    let width: Double?
    let height: Double?
    let depth: Double?
    let backOffset: Double?
    let rotationAnchor: Vec3?
    let opacity: Double?
    let visible: Bool?
    let scrollWithParent: Bool?
    let zIndex: Double?
    let enableGesture: Bool?

    let scrollPageEnabled: Bool?
    let material: BackgroundMaterial?
    let cornerRadius: CornerRadius?
    
    // this value is used by previous WebSpatial code, keep it here only for Compatibility consideration
    // may delete it when we think it's not needed
    let scrollEdgeInsetsMarginRight: Double?
}

struct UpdateSpatializedStatic3DElementProperties: SpatializedElementProperties {
    static let commandType: String = "UpdateSpatializedStatic3DElementProperties"
    let id: String
    let name: String?
    let width: Double?
    let height: Double?
    let depth: Double?
    let backOffset: Double?
    let rotationAnchor: Vec3?
    let opacity: Double?
    let visible: Bool?
    let scrollWithParent: Bool?
    let zIndex: Double?
    let enableGesture: Bool?

    let modelURL: String?
}

struct UpdateSpatializedElementTransform: SpatialObjectCommand {
    static let commandType: String = "UpdateSpatializedElementTransform"
    let id: String
    let position: Vec3?
    let quaternion: Vec4?
    let scale: Vec3?
}

struct AddSpatializedElementToSpatialized2DElement: SpatialObjectCommand {
    static let commandType: String = "AddSpatializedElementToSpatialized2DElement"
    let id: String
    let spatializedElementId: String
}

// incomming JSB data
struct XSceneOptionsJSB: Codable {
    let defaultSize: Size?
    let type: SpatialScene.WindowStyle?
    let resizability: ResizeRange?
    let worldScaling: WorldScalingJSB?
    let worldAlignment: WorldAlignmentJSB?
    let baseplateVisibility: BaseplateVisibilityJSB?
}

enum BaseplateVisibilityJSB: String, Codable {
    case automatic
    case visible
    case hidden
    
    var toSDK: Visibility {
        switch self {
            case .automatic: return .automatic
            case .visible: return .visible
            case .hidden: return .hidden
        }
    }
}

enum WorldScalingJSB: String, Codable {
    case automatic
    case dynamic
    
    var toSDK: WorldScalingBehavior {
        switch self {
            case .automatic: return .automatic
            case .dynamic: return .dynamic
        }
    }
}

enum WorldAlignmentJSB: String, Codable {
    case adaptive
    case automatic
    case gravityAligned
    
    var toSDK: WorldAlignmentBehavior {
        switch self {
            case .adaptive: return .adaptive
            case .automatic: return .automatic
            case .gravityAligned: return .gravityAligned
        }
    }
}

struct UpdateSceneConfigCommand: CommandDataProtocol {
    static let commandType = "UpdateSceneConfig"
    let config: XSceneOptionsJSB
    init(_ data: XSceneOptionsJSB) {
        config = data
    }
}

struct FocusSceneCommand: CommandDataProtocol {
    static let commandType = "FocusScene"
    let id: String
    init(_ id: String) {
        self.id = id
    }
}

struct GetSpatialSceneStateCommand: CommandDataProtocol {
    static let commandType = "GetSpatialSceneState"
}

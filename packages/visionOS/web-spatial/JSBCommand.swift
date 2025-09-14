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

struct CreateSpatializedDynamic3DElement: CommandDataProtocol{
    static let commandType: String = "CreateSpatializedDynamic3DElement"
    let test: Bool
}

struct CreateSpatialEntity: CommandDataProtocol{
    static let commandType: String = "CreateSpatialEntity"
    let name: String?
}

struct CreateGeometryProperties: CommandDataProtocol{
    static let commandType: String = "CreateGeometry"
    let type: String
    let width: Float?
    let height: Float?
    let depth: Float?
    let cornerRadius: Float?
    let splitFaces: Bool?
    let radius: Float?
}

struct CreateUnlitMaterial: CommandDataProtocol{
    static let commandType: String = "CreateUnlitMaterial"
    let color: String?
    let textureId: String?
    let transparent: Bool?
    let opacity: Float?
}

struct CreateTexture: CommandDataProtocol{
    static let commandType: String = "CreateTexture"
    let url: String
}

struct CreateModelAsset: CommandDataProtocol{
    static let commandType: String = "CreateModelAsset"
    let url: String
}

struct CreateSpatialModelEntity: CommandDataProtocol{
    static let commandType: String = "CreateSpatialModelEntity"
    let modelAssetId:String
    let name:String?
}

struct CreateModelComponent: CommandDataProtocol{
    static let commandType: String = "CreateModelComponent"
    let geometryId: String
    let materialIds: [String]
}

struct AddComponentToEntity: CommandDataProtocol{
    static let commandType: String = "AddComponentToEntity"
    let entityId: String
    let componentId: String
}

struct AddEntityToDynamic3D: CommandDataProtocol{
    static let commandType: String = "AddEntityToDynamic3D"
    let dynamic3dId: String
    let entityId: String
}

struct AddEntityToEntity: CommandDataProtocol{
    static let commandType: String = "AddEntityToEntity"
    let childId: String
    let parentId: String
}

struct RemoveEntityFromParent: CommandDataProtocol{
    static let commandType: String = "RemoveEntityFromParent"
    let entityId: String
}

struct UpdateEntityProperties: CommandDataProtocol{
    static let commandType: String = "UpdateEntityProperties"
    let entityId: String
    let transform: [String:Float]
}

struct UpdateEntityEvent: CommandDataProtocol{
    static let commandType: String = "UpdateEntityEvent"
    let type: String
    let entityId: String
    let isEnable:Bool
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
    var clientX: Double? { get }
    var clientY: Double? { get }
    var width: Double? { get }
    var height: Double? { get }
    var depth: Double? { get }
    var backOffset: Double? { get }
    var rotationAnchor: Vec3? { get }
    var opacity: Double? { get }
    var visible: Bool? { get }
    var scrollWithParent: Bool? { get }
    var zIndex: Double? { get }
    
    var enableDragStartGesture: Bool? { get }
    var enableDragGesture: Bool? { get }
    var enableDragEndGesture: Bool? { get }
    
    var enableRotateStartGesture: Bool? { get }
    var enableRotateGesture: Bool? { get }
    var enableRotateEndGesture: Bool? { get }
    var enableMagnifyStartGesture: Bool? { get }
    var enableMagnifyGesture: Bool? { get }
    var enableMagnifyEndGesture: Bool? { get }
    var enableTapGesture: Bool? { get }
}

struct UpdateSpatialized2DElementProperties: SpatializedElementProperties {
    static let commandType: String = "UpdateSpatialized2DElementProperties"
    let id: String
    let name: String?
    var clientX: Double?
    var clientY: Double?
    let width: Double?
    let height: Double?
    let depth: Double?
    let backOffset: Double?
    let rotationAnchor: Vec3?
    let opacity: Double?
    let visible: Bool?
    let scrollWithParent: Bool?
    let zIndex: Double?
    
    var enableDragStartGesture: Bool?
    var enableDragGesture: Bool?
    var enableDragEndGesture: Bool?
    var enableRotateStartGesture: Bool?
    var enableRotateGesture: Bool?
    var enableRotateEndGesture: Bool?
    var enableMagnifyStartGesture: Bool?
    var enableMagnifyGesture: Bool?
    var enableMagnifyEndGesture: Bool?
    var enableTapGesture: Bool?  
    
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
    var clientX: Double?
    var clientY: Double?  
    let width: Double?
    let height: Double?
    let depth: Double?
    let backOffset: Double?
    let rotationAnchor: Vec3?
    let opacity: Double?
    let visible: Bool?
    let scrollWithParent: Bool?
    let zIndex: Double?
    
    var enableDragStartGesture: Bool?
    let enableDragGesture: Bool?
    let enableDragEndGesture: Bool?
    var enableRotateStartGesture: Bool?
    let enableRotateGesture: Bool?
    let enableRotateEndGesture: Bool?
    var enableMagnifyStartGesture: Bool?
    let enableMagnifyGesture: Bool?
    let enableMagnifyEndGesture: Bool?
    let enableTapGesture: Bool?

    let modelURL: String?
}

struct UpdateSpatializedDynamic3DElementProperties: SpatializedElementProperties {
    static let commandType: String = "UpdateSpatializedDynamic3DElementProperties"
    let id: String
    let name: String?
    var clientX: Double?
    var clientY: Double?
    let width: Double?
    let height: Double?
    let depth: Double?
    let backOffset: Double?
    let rotationAnchor: Vec3?
    let opacity: Double?
    let visible: Bool?
    let scrollWithParent: Bool?
    let zIndex: Double?
    
    var enableDragStartGesture: Bool?
    let enableDragGesture: Bool?
    let enableDragEndGesture: Bool?
    var enableRotateStartGesture: Bool?
    let enableRotateGesture: Bool?
    let enableRotateEndGesture: Bool?
    var enableMagnifyStartGesture: Bool?
    let enableMagnifyGesture: Bool?
    let enableMagnifyEndGesture: Bool?
    let enableTapGesture: Bool?
}

struct UpdateSpatializedElementTransform: SpatialObjectCommand {
    static let commandType: String = "UpdateSpatializedElementTransform"
    let id: String
    let matrix: [Double]
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

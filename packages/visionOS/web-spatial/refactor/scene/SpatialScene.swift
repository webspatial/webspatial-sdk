import Foundation

@Observable
class SpatialScene: SpatialObject {
    private static let RootID = "root"
    static func getRootID() -> String {
        return RootID
    }

    var width: Double = 0
    var height: Double = 0
    var url: String = "" // start_url
    var windowStyle = "Plain" // TODO: type
    var minWidth: Double = 0
    var maxWidth: Double = 0
    var minHeight: Double = 0
    var maxHeight: Double = 0
    var backgroundMaterial: BackgroundMaterial? = nil
    var cornerRadius: CornerRadius? = nil
    var spatialized2DElement = [String: Spatialized2DElement]() // id => ele
    var spatializedStatic3DElement = [String: SpatializedStatic3DElement]() // id => ele
    var spatializedDynamic3DElement = [String: SpatializedDynamic3DElement]() // id => ele
    var offset: [Double] = [0, 0]

    var wgd: WindowContainerData // windowGroupData used to open/dismiss

//    private var spatialWebviewModel: SpatialWebviewModelFake?

    private var childResources = [String: SpatializedElement]() // id => ele

    init(_ name: String, _ data: WindowContainerData) {
        wgd = data
        super.init(name)
    }

    func addChildResource(_ element: SpatializedElement) {
        childResources[element.id] = element
        element
            .on(
                event: SpatializedElement.Events.BeforeDestroyed.rawValue,
                listener: onSpatializedElementDestroyed
            )
    }

    func removeChildResource(_ element: SpatializedElement) {
        childResources.removeValue(forKey: element.id)
    }

    func onSpatializedElementDestroyed(_ object: Any, _ data: Any) {
        let element = object as! SpatializedElement
        element
            .off(
                event: SpatializedElement.Events.BeforeDestroyed.rawValue,
                listener: onSpatializedElementDestroyed
            )
        removeChildResource(element)
    }

    static func getSpatialScene(_ name: String) -> SpatialScene? {
        return SpatialObject.get(name) as? SpatialScene
    }

    static func getOrCreateSpatialScene(_ name: String, _ data: WindowContainerData) -> SpatialScene? {
        if let scene = getSpatialScene(name) {
            return scene
        }
        let newScene = SpatialScene(name, data)
        return newScene
    }

    func addElement(_ parent_id: String, _ element: SpatializedElement) {
        var isSuccess = true
        if parent_id == id {
            // add direct child
            switch element {
            case let twoD as Spatialized2DElement:
                spatialized2DElement[twoD.id] = twoD
            case let static3D as SpatializedStatic3DElement:
                spatializedStatic3DElement[static3D.id] = static3D
            case let dynamic3D as SpatializedDynamic3DElement:
                spatializedDynamic3DElement[dynamic3D.id] = dynamic3D
            default:
                print("unsupported element type")
                isSuccess = false
            }

        } else {
            // find element and add to it
            if let record = childResources[parent_id] {
                record.addChild(element)
            } else {
                print("no matched parent id:", parent_id)
                isSuccess = false
            }
        }

        if isSuccess {
            addChildResource(element)
        }
    }

    func removeElement(_ parent_id: String, _ element: SpatializedElement) {
        var isSuccess = true
        if parent_id == id {
            // Remove from the appropriate array
            if spatialized2DElement[element.id] != nil {
                spatialized2DElement.removeValue(forKey: element.id)
            } else if spatializedStatic3DElement[element.id] != nil {
                spatializedStatic3DElement.removeValue(forKey: element.id)
            } else if spatializedDynamic3DElement[element.id] != nil {
                spatializedDynamic3DElement.removeValue(forKey: element.id)
            } else {
                print("Element with id \(element.id) not found in any list")
                isSuccess = false
            }
        } else {
            // find element and call remove on it
            if let record = childResources[parent_id] {
                record.removeChild(element)
            } else {
                print("no matched parent id:", parent_id)
                isSuccess = false
            }
        }

        if isSuccess {
            element.destroy() // will remove from childResources
        }
    }
}

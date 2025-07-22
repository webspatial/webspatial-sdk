import Combine
import Foundation

struct SceneData: Decodable, Hashable, Encodable {
    let windowStyle: String
    let sceneID: String
}

struct SceneJSBDataNew: Codable {
    var method: String?
    var sceneName: String?
    var sceneConfig: WindowContainerOptions?
    var url: String?
    var sceneID: String?
}

@Observable
class SpatialScene: SpatialObject {
    private static let RootID = "root"
    static func getRootID() -> String {
        return RootID
    }

    var toggleImmersiveSpace = PassthroughSubject<Bool, Never>()

    var setSize = PassthroughSubject<CGSize, Never>()
    var setResizeRange = PassthroughSubject<ResizeRange, Never>()

    var updateFrame = false
    var openWindowData = PassthroughSubject<SceneData, Never>()
    var closeWindowData = PassthroughSubject<WindowContainerData, Never>()

    var setLoadingWindowData = PassthroughSubject<LoadingWindowContainerData, Never>()

//    var width: Double = 0
//    var height: Double = 0
    var url: String = "" // start_url
    var windowStyle = "Plain" // TODO: type
//    var minWidth: Double = 0
//    var maxWidth: Double = 0
//    var minHeight: Double = 0
//    var maxHeight: Double = 0
    var backgroundMaterial: BackgroundMaterial? = nil
    var cornerRadius: CornerRadius? = nil
    var spatialized2DElement = [String: Spatialized2DElement]() // id => ele
    var spatializedStatic3DElement = [String: SpatializedStatic3DElement]() // id => ele
    var spatializedDynamic3DElement = [String: SpatializedDynamic3DElement]() // id => ele
    var offset: [Double] = [0, 0]

    var wgd: SceneData // windowGroupData used to open/dismiss

    var plainDefaultValues: WindowContainerPlainDefaultValues?
    // TODO: var VolumeDefaultValues: WindowContainerPlainDefaultValues

    enum SceneStateKind: String {
        case created
        case configured
        case active
    }

    var state: SceneStateKind = .created

    weak var parent: SpatialScene? = nil

//    private var spatialWebviewModel: SpatialWebviewModelFake?

    var spatialWebviewModel: SpatialWebViewModel?

    private var childResources = [String: SpatializedElement]() // id => ele

    init(_ name: String, _ data: SceneData) {
        wgd = data
        super.init(name)
        // TODO: should we setup this one
    }

    init(_ name: String, _ url: String, _ data: SceneData) {
        wgd = data
        self.url = url
        super.init(name)
        spatialWebviewModel = SpatialWebViewModel(url: url)
        setup()
    }

    private func setup() {
        setupWindowOpen()
        setupJSB()
    }

    private func setupWindowOpen() {
        spatialWebviewModel?.addOpenWindowListener(protocal: "http", event: { url in
            print("url,", url)
            let sceneId = UUID().uuidString
            let wgd = SceneData(windowStyle: "Plain", sceneID: sceneId)
            let newScene = SpatialScene(sceneId, url, wgd)

//            self.openWindowData.send(wgd) //TODO: should invode in JSB handler
            DispatchQueue.main.async {
                newScene.spatialWebviewModel!.evaluateJS(js: "window._webSpatialID = '" + sceneId + "'")
            }

            return newScene.spatialWebviewModel!
        })
    }

    private func setupJSB() {
        spatialWebviewModel?
            .addJSBListener(dataClass: SceneCommand.self, event: handleJSB)
    }

    private func handleJSB(_ data: SceneCommand) {
        print("Scene::handleJSB", data.sceneData)
        // find scene
        if let method = data.sceneData.method,
           let sceneId = data.sceneData.sceneID,
           let targetScene = SpatialScene.getSpatialScene(sceneId)
        {
            if method == "createRoot" {
                if let sceneConfig = data.sceneData.sceneConfig {
                    // config
                    targetScene.plainDefaultValues = WindowContainerPlainDefaultValues(sceneConfig)

                    // finish config
                    targetScene.parent = self
                    targetScene.state = .configured

                    targetScene.show()
                }
            }
            // check state
            if targetScene.state == .configured {}
        }
    }

    private class SceneCommand: CommandDataProtocol {
        static let commandType = "createScene"

        var windowStyle: String
        var sceneData: SceneJSBDataNew

        init(_ msg: String, _ data: SceneJSBDataNew) {
            windowStyle = msg
            sceneData = data
        }
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

    static func getOrCreateSpatialScene(_ name: String, _ data: SceneData) -> SpatialScene? {
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

    func show() {
        guard state == .configured else { return }

        if let pScene = parent {
            // set defaultSize and resizability

            state = .active

            // plain show
            print("plainDefaultValues", plainDefaultValues)
            if plainDefaultValues != nil {
                WindowContainerMgr.Instance
                    .updateWindowContainerPlainDefaultValues(
                        plainDefaultValues!
                    ) // set default values
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    pScene.openWindowData.send(self.wgd) // openwindow
                }
            }
        }
    }
}

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

struct LoadingJSBDataNew: Codable {
    var method: String?
    var style: String?
}

@Observable
class SpatialSceneX: SpatialObject {
    // TOPIC
    var toggleImmersiveSpace = PassthroughSubject<Bool, Never>()

    var setSize = PassthroughSubject<CGSize, Never>()
    var setResizeRange = PassthroughSubject<ResizeRange, Never>()

    var openWindowData = PassthroughSubject<SceneData, Never>()
    var closeWindowData = PassthroughSubject<SceneData, Never>()

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

//    var wgd: SceneData // windowGroupData used to open/dismiss

    func getSceneData() -> SceneData {
        return SceneData(windowStyle: windowStyle, sceneID: id)
    }

    var plainDefaultValues: WindowContainerPlainDefaultValues?
    // TODO: var volumeDefaultValues: WindowContainerVolumeDefaultValues

    enum SceneStateKind: String {
        case idle
        case pending
        case configured
        case success
        case fail
    }

    var state: SceneStateKind = .idle

    weak var parent: SpatialSceneX? = nil

//    private var spatialWebviewModel: SpatialWebviewModelFake?

    var spatialWebviewModel: SpatialWebViewModel?

    private var childResources = [String: SpatializedElement]() // id => ele

    override init(_ windowStyle: String) {
        self.windowStyle = windowStyle
        super.init()
        // TODO: should we setup this one
    }

    init(_ url: String, _ windowStyle: String) {
        self.windowStyle = windowStyle
        self.url = url
        super.init()
        spatialWebviewModel = SpatialWebViewModel(url: url)
        setup()
    }

    private func setup() {
        spatialWebviewModel?
            .addOpenWindowListener(
                protocal: "webspatial://createscene",
                event: handleWindowOpenCustom
            )
        spatialWebviewModel?.addStatChangeListener(event: { state in
            if state == "didClose" {
                self.handleWindowClose()
            }
        })
        spatialWebviewModel?
            .addJSBListener(SceneCommand.self) { command, _, _ in
                guard let sceneData = command?.sceneData else {
                    return
                }
                print("Scene::handleJSB", sceneData)
                // find scene
                if let method = sceneData.method,
                   let sceneId = sceneData.sceneID,
                   let targetScene = SpatialAppX.getScene(sceneId)
                {
                    if method == "showRoot" {
                        if let sceneConfig = sceneData.sceneConfig {
                            // config
                            let cfg = WindowContainerPlainDefaultValues(sceneConfig)
                            targetScene.open(cfg)
                        } else {
                            // error!
                            print("should have config")
                        }
                    }
                }
            }
    }

    private func handleWindowOpenCustom(_ url: URL) -> WebViewElementInfo? {
//        print("handleWindowOpenCustom::url",url)
        // get config from url

        guard let components = URLComponents(string: url.absoluteString),
              let queryItems = components.queryItems
        else {
            print("❌ fail to parse URL")
            return nil
        }

        guard let encodedUrl = queryItems.first(where: { $0.name == "url" })?.value,
              let decodedUrl = encodedUrl.removingPercentEncoding
        else {
            print("❌ lack of required param url")
            return nil
        }

        let newScene = SpatialAppX.createScene(decodedUrl)
        print("newScene url:", newScene.url)
        newScene.setParent(self)

        guard let encodedConfig = queryItems.first(where: { $0.name == "config" })?.value,
              let decodedConfig = encodedConfig.removingPercentEncoding
        else {
            print("no config")

            newScene.open()
            // no config
            return WebViewElementInfo(
                id: newScene.id,
                element: newScene.spatialWebviewModel!
            )
//            return newScene.spatialWebviewModel
        }

        // has config

        let decoder = JSONDecoder()
        guard let configData = decodedConfig.data(using: .utf8) else {
            print("❌ no config key")
            // should not go here
            return nil
        }

        var config: WindowContainerOptions? = nil

        if decodedConfig == "undefined" || decodedConfig == "null" {
            config = nil
        } else {
            do {
                config = try decoder.decode(WindowContainerOptions.self, from: configData)
            } catch {
                print("❌ config JSON decode fail: \(decodedConfig)")
                return nil
            }
        }

//        print("config::",config)

        if let cfg = config {
            newScene.open(WindowContainerPlainDefaultValues(cfg))
        } else {
            newScene.open()
            // FIXME: to trigger load
            DispatchQueue.main.async {
                newScene.spatialWebviewModel?.load(decodedUrl)
            }
        }
        return WebViewElementInfo(
            id: newScene.id,
            element: newScene.spatialWebviewModel!
        )
//        return newScene.spatialWebviewModel
    }

    private func handleWindowClose() {
        print("window.close")
        closeWindowData.send(getSceneData())
    }

    private func handleJSBScene(_ data: SceneCommand) {
        print("Scene::handleJSB", data.sceneData)
        // find scene
        if let method = data.sceneData.method,
           let sceneId = data.sceneData.sceneID,
           let targetScene = SpatialAppX.getScene(sceneId)
        {
            if method == "showRoot" {
                if let sceneConfig = data.sceneData.sceneConfig {
                    // config
                    let cfg = WindowContainerPlainDefaultValues(sceneConfig)
                    targetScene.open(cfg)
                } else {
                    // error!
                    print("should have config")
                }
            }
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

    func setParent(_ p: SpatialSceneX) {
        parent = p
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

    func createElement() {}

    func updateElement() {
        // TODO:
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

    override func onDestroy() {
        print("scene::onDestroy")
        spatialWebviewModel?.destory()
        childResources.forEach { $0.value.destroy() }
        childResources = [:]
    }

    func moveToState(_ newState: SceneStateKind) {
        if canEnterState(state, newState) {
            if state == .idle && newState == .pending {
                setLoading(true)
            } else if state == .pending && newState == .configured {
                setLoading(false)
            }

            state = newState
            print("currentState:", state)
        } else {
            print("invalid state transition from \(state) to \(newState)")
        }
    }

    private func canEnterState(_ from: SceneStateKind, _ to: SceneStateKind) -> Bool {
        // rules for state transition
        switch from {
        case .idle:
            return to == .configured || to == .pending
        case .pending:
            return to == .configured
        case .configured:
            return to == .success || to == .fail
        default:
            return false
        }
    }

    private func setLoading(_ on: Bool) {
        if on {
            let lwgdata = LoadingWindowContainerData(
                method: .show,
                windowStyle: nil
            )
            parent?.setLoadingWindowData.send(lwgdata)
        } else {
            let lwgdata = LoadingWindowContainerData(
                method: .hide,
                windowStyle: nil
            )
            parent?.setLoadingWindowData.send(lwgdata)
        }
    }

    func open(_ config: WindowContainerPlainDefaultValues? = nil) {
        print("open", config, state)
        guard state == .idle || state == .pending else { return }

        if state == .idle && config == nil {
            moveToState(.pending)
            return
        }

        if state == .pending && config != nil {
            moveToState(.configured)
        }

        if config != nil {
            plainDefaultValues = config
        }

        if let pScene = parent {
            // plain show
            print("plainDefaultValues", plainDefaultValues)
            if plainDefaultValues != nil {
                WindowContainerMgr.Instance
                    .updateWindowContainerPlainDefaultValues(
                        plainDefaultValues!
                    ) // set default values
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    pScene.openWindowData
                        .send(self.getSceneData()) // openwindow
                    self.moveToState(.success)
                }
            }
        }
    }
}

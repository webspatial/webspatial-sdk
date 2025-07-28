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
class SpatialScene: SpatialObject, ScrollAbleSpatialElementContainer {
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
    //    var backgroundMaterial: BackgroundMaterial? = nil
    //    var cornerRadius: CornerRadius? = nil
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

    weak var parent: SpatialScene? = nil

    //    private var spatialWebViewModel: SpatialWebviewModelFake?

    var spatialWebViewModel: SpatialWebViewModel

    //    override init(_ windowStyle: String) {
    //        self.windowStyle = windowStyle
    //        super.init()
    //        // TODO: should we setup this one
    //    }

    init(_ url: String, _ windowStyle: String) {
        self.windowStyle = windowStyle
        self.url = url
        spatialWebViewModel = SpatialWebViewModel(url: url)
        super.init()

        setup()
    }

    private func setup() {
        spatialWebViewModel
            .addOpenWindowListener(
                protocal: "webspatial://createscene",
                event: handleWindowOpenCustom
            )
        spatialWebViewModel.addStatChangeListener(event: { state in
            if state == "didClose" {
                self.handleWindowClose()
            }
        })
        spatialWebViewModel
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
        setupJSBListeners()
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
                element: newScene.spatialWebViewModel
            )
            //            return newScene.spatialWebViewModel
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
                newScene.spatialWebViewModel.load(decodedUrl)
            }
        }
        return WebViewElementInfo(
            id: newScene.id,
            element: newScene.spatialWebViewModel
        )
        //        return newScene.spatialWebViewModel
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

    func setParent(_ p: SpatialScene) {
        parent = p
    }

    func createElement() {}

    func updateElement() {
        // TODO:
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

        if (state == .pending || state == .idle) && config != nil {
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

    private func setupJSBListeners() {
        spatialWebViewModel.addJSBListener(UpdateSpatialSceneMaterial.self) { command, resolve, _ in
            self.backgroundMaterial = command.material
            resolve()
        }
        spatialWebViewModel.addJSBListener(UpdateSpatialSceneCorer.self) { command, resolve, _ in
            self.cornerRadius = command.cornerRadius
            resolve()
        }

        spatialWebViewModel.addJSBListener(PingCommand.self) { _, resolve, _ in
            resolve()
        }

        spatialWebViewModel.addJSBListener(AddSpatializedElementToSpatialScene.self, onAddSpatializedElement)

        spatialWebViewModel.addJSBListener(UpdateSpatialized2DElementProperties.self, onUpdateSpatialized2DElementProperties)

        spatialWebViewModel.addJSBListener(UpdateSpatializedElementTransform.self, onUpdateSpatializedElementTransform)

        spatialWebViewModel.addJSBListener(UpdateSpatialized2DElementMaterial.self, onUpdateSpatialized2DElementMaterial)

        spatialWebViewModel.addJSBListener(UpdateSpatialized2DElementCorner.self, onUpdateSpatialized2DElementCorner)

        spatialWebViewModel.addJSBListener(AddSpatializedElementToSpatialized2DElement.self, onAddSpatializedElementToSpatialized2DElement)

        spatialWebViewModel.addOpenWindowListener(protocal: "webspatial") { _ in
            let spatialized2DElement: Spatialized2DElement = self.createSpatializedElement(type: .Spatialized2DElement)
            return WebViewElementInfo(id: spatialized2DElement.id, element: spatialized2DElement.getWebViewModel())
        }
    }

    private func setupWebViewStateListner() {
        spatialWebViewModel.addStateListener(.didUnload) {
            print("---------------onLeavePageSession---------------")
            self.onLeavePageSession()
        }

        spatialWebViewModel.addScrollUpdateListener { _, point in
            self._scrollOffset.x = point.x
            self._scrollOffset.y = point.y
        }
    }

    private func onLeavePageSession() {
        // destroy all SpatialObject asset
        let spatialObjectArray = spatialObjects.map { $0.value }
        for spatialObject in spatialObjectArray {
            spatialObject.destroy()
        }
    }

    private func onUpdateSpatialized2DElementMaterial(command: UpdateSpatialized2DElementMaterial, resolve: @escaping () -> Void, _ reject: @escaping (_ code: ReplyCode, _ message: String) -> Void) {
        guard let spatialized2DElement: Spatialized2DElement = findSpatialObject(command.id) else {
            reject(.InvalidSpatialObject, "invalid UpdateSpatialized2DElementMaterial spatial object id not exsit!")
            return
        }

        spatialized2DElement.backgroundMaterial = command.material
        resolve()
    }

    private func onAddSpatializedElementToSpatialized2DElement(command: AddSpatializedElementToSpatialized2DElement, resolve: @escaping () -> Void, _ reject: @escaping (_ code: ReplyCode, _ message: String) -> Void) {
        guard let spatialized2DElement: Spatialized2DElement = findSpatialObject(command.id)
        else {
            reject(.InvalidSpatialObject, "invalid AddSpatializedElementToSpatialized2DElement spatial object id not exsit!")
            return
        }

        guard let targetSpatializedElement: SpatializedElement = findSpatialObject(command.spatializedElementId) else {
            reject(.InvalidSpatialObject, "invalid AddSpatializedElementToSpatialized2DElement target spatial object id not exsit!")
            return
        }

        targetSpatializedElement.setParent(spatialized2DElement)
        resolve()
    }

    private func onUpdateSpatialized2DElementCorner(command: UpdateSpatialized2DElementCorner, resolve: @escaping () -> Void, _ reject: @escaping (_ code: ReplyCode, _ message: String) -> Void) {
        guard let spatialized2DElement: Spatialized2DElement = findSpatialObject(command.id) else {
            reject(.InvalidSpatialObject, "invalid UpdateSpatialized2DElementMaterial spatial object id not exsit!")
            return
        }

        spatialized2DElement.cornerRadius = command.cornerRadius
        resolve()
    }

    private func onUpdateSpatialized2DElementProperties(command: UpdateSpatialized2DElementProperties, resolve: @escaping () -> Void, _ reject: @escaping (_ code: ReplyCode, _ message: String) -> Void) {
        guard let spatialized2DElement: Spatialized2DElement = findSpatialObject(command.id) else {
            reject(.InvalidSpatialObject, "invalid updateSpatializedElementProperties spatial object id not exsit!")
            return
        }
        updateSpatializedElementProperties(spatialized2DElement, command)
        if let scrollEnabled = command.scrollEnabled {
            spatialized2DElement.scrollEnabled = scrollEnabled
        }

        resolve()
    }

    private func updateSpatializedElementProperties(_ spatializedElement: SpatializedElement, _ command: SpatializedElementProperties) {
        if let width = command.width {
            spatializedElement.width = width
        }

        if let height = command.height {
            spatializedElement.height = height
        }

        if let backOffset = command.backOffset {
            spatializedElement.backOffset = backOffset
        }

        if let opacity = command.opacity {
            spatializedElement.opacity = opacity
        }

        if let scrollWithParent = command.scrollWithParent {
            spatializedElement.scrollWithParent = scrollWithParent
        }

        if let visible = command.visible {
            spatializedElement.visible = visible
        }

        if let zIndex = command.zIndex {
            spatializedElement.zIndex = zIndex
        }

        if let rotationAnchor = command.rotationAnchor {
            spatializedElement.rotationAnchor = .init(x: CGFloat(rotationAnchor.x), y: CGFloat(rotationAnchor.y), z: CGFloat(rotationAnchor.z))
        }
    }

    private func onUpdateSpatializedElementTransform(command: UpdateSpatializedElementTransform, resolve: @escaping () -> Void, _ reject: @escaping (_ code: ReplyCode, _ message: String) -> Void) {
        guard let spatializedElement: SpatializedElement = findSpatialObject(command.id) else {
            reject(.InvalidSpatialObject, "invalid UpdateSpatializedElementTransform spatial object id not exsit!")
            return
        }

        if let position = command.position {
            spatializedElement.transform.translation = SIMD3<Float>(Float(position.x), Float(position.y), Float(position.z))
        }

        if let quaternion = command.quaternion {
            spatializedElement.transform.rotation.vector = SIMD4<Float>(Float(quaternion.x), Float(quaternion.y), Float(quaternion.z), Float(quaternion.w))
        }

        if let scale = command.scale {
            spatializedElement.transform.scale = SIMD3<Float>(Float(scale.x), Float(scale.y), Float(scale.z))
        }

        resolve()
    }

    private func onAddSpatializedElement(command: AddSpatializedElementToSpatialScene, resolve: @escaping () -> Void, _ reject: @escaping (_ code: ReplyCode, _ message: String) -> Void) {
        guard let spatializedElement: SpatializedElement = findSpatialObject(command.spatializedElementId) else {
            reject(.InvalidSpatialObject, "invalid addSpatializedElementCommand spatial object id not exsit!")
            return
        }

        spatializedElement.setParent(self)
        resolve()
    }

    /*
     * Begin Implement SpatializedElementContainer Protocol
     */

    // SpatialScene can hold a collection of SpatializedElement children
    private var children = [String: SpatializedElement]()

    // Called by SpatializedElement.setParent
    func addChild(_ spatializedElement: SpatializedElement) {
        children[spatializedElement.id] = spatializedElement
    }

    // Called by SpatializedElement.setParent
    func removeChild(_ spatializedElement: SpatializedElement) {
        children.removeValue(forKey: spatializedElement.id)
    }

    func getChildrenOfType(_ type: SpatializedElementType) -> [String: SpatializedElement] {
        let typedChildren = children.filter {
            switch type {
            case .Spatialized2DElement:
                return $0.value is Spatialized2DElement
            case .SpatializedStatic3DElement:
                return $0.value is SpatializedStatic3DElement
            case .SpatializedDynamic3DElement:
                return $0.value is SpatializedDynamic3DElement
            }
        }
        return typedChildren
    }

    /*
     * End Implement SpatializedElementContainer Protocol
     */

    //    private var spatialWebViewModel: SpatialWebViewModel

    /*
     * Begin Implement SpatialScrollAble Protocol
     */
    let scrollEnabled: Bool = true

    var _scrollOffset: Vec2 = .init(x: 0, y: 0)
    var scrollOffset: Vec2 {
        get {
            return _scrollOffset
        }
        set(newValue) {
            _scrollOffset = newValue
        }
    }

    func updateDeltaScrollOffset(_ delta: Vec2) {
        spatialWebViewModel.setScrollOffset(_scrollOffset + delta)
    }

    func stopScrolling() {
        spatialWebViewModel.stopScrolling()
    }

    /*
     * End Implement SpatialScrollAble Protocol
     */

    private var _backgroundMaterial = BackgroundMaterial.None
    var backgroundMaterial: BackgroundMaterial {
        get {
            return _backgroundMaterial
        }
        set(newValue) {
            _backgroundMaterial = newValue
            spatialWebViewModel.setBackgroundTransparent(_backgroundMaterial != .None)
        }
    }

    var cornerRadius: CornerRadius = .init()

    func getView() -> SpatialWebView {
        return spatialWebViewModel.getView()
    }

    /*
     * Begin SpatialObjects management
     */

    // Resources that will be destroyed when this webpage is destoryed or if it is navigated away from
    private var spatialObjects = [String: SpatialObject]()

    func createSpatializedElement<T: SpatializedElement>(type: SpatializedElementType) -> T {
        let spatializedElement: T = switch type {
        case .Spatialized2DElement:
            Spatialized2DElement() as! T
        case .SpatializedStatic3DElement:
            SpatializedStatic3DElement() as! T
        case .SpatializedDynamic3DElement:
            SpatializedDynamic3DElement() as! T
        }

        addSpatialObject(spatializedElement)

        return spatializedElement
    }

    func createEntity() {
        //      @fukang: add Entity here
    }

    func createComponent() {
        //      @fukang: add Component here
    }

    private func addSpatialObject(_ spatialObject: SpatialObject) {
        spatialObjects[spatialObject.id] = spatialObject
        spatialObject
            .on(
                event: SpatialObject.Events.BeforeDestroyed.rawValue,
                listener: onSptatialObjectDestroyed
            )
    }

    private func onSptatialObjectDestroyed(_ object: Any, _ data: Any) {
        let spatialObject = object as! SpatialObject
        spatialObject
            .off(
                event: SpatialObject.Events.BeforeDestroyed.rawValue,
                listener: onSptatialObjectDestroyed
            )
        spatialObjects.removeValue(forKey: spatialObject.id)
    }

    func findSpatialObject<T: SpatialObject>(_ id: String) -> T? {
        return spatialObjects[id] as? T
    }

    /*
     * End SpatialObjects management
     */

    override func onDestroy() {
        print("scene::onDestroy")
        let spatialObjectArray = spatialObjects.map { $0.value }
        for spatialObject in spatialObjectArray {
            spatialObject.destroy()
        }
        spatialWebViewModel.destroy()
    }

    override func inspect() -> [String: Any] {
        let childrenInfo = children.mapValues { spatializedElement in
            spatializedElement.inspect()
        }

        var inspectInfo: [String: Any] = [
            "children": childrenInfo,
            "backgroundMaterial": backgroundMaterial,
            "cornerRadius": cornerRadius.toJson(),
            "scrollOffset": scrollOffset,
            "url": spatialWebViewModel.url,
        ]

        let baseInspectInfo = super.inspect()
        for (key, value) in baseInspectInfo {
            inspectInfo[key] = value
        }
        return inspectInfo
    }
}

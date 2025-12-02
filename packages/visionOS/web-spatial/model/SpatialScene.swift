import Combine
import Foundation
import simd
import SwiftUI

struct CustomReplyData: Codable {
    let type: String
    let name: String
}

struct AddSpatializedElementReply: Codable {
    let id: String
}

struct ResizeRange: Codable {
    var minWidth: Double?
    var minHeight: Double?
    var maxWidth: Double?
    var maxHeight: Double?
}

struct ConvertReply: Codable {
    let id: String
    let position: SIMD3<Float>
}

let baseReplyData = CustomReplyData(type: "BasicData", name: "jsb call back")

let defaultSceneConfig = SceneOptions(
    defaultSize: Size(width: 1280, height: 720),
    windowResizability: .automatic,
    worldScaling: .automatic,
    worldAlignment: .automatic,
    baseplateVisibility: .automatic
)

@Observable
class SpatialScene: SpatialObject, ScrollAbleSpatialElementContainer, WebMsgSender {
    var parent: (any ScrollAbleSpatialElementContainer)?

    // Enum
    enum WindowStyle: String, Codable, CaseIterable {
        case window
        case volume
    }

    // TOPIC begin
    var openWindowData = PassthroughSubject<String, Never>()
    var closeWindowData = PassthroughSubject<String, Never>()

    var setLoadingWindowData = PassthroughSubject<XLoadingViewData, Never>()

    var url: String = "" // start_url
    var windowStyle: WindowStyle {
        didSet {
            resetBackgroundMaterialOnWindowStyleChange(windowStyle)
        }
    }

    private func resetBackgroundMaterialOnWindowStyleChange(_ windowStyle: WindowStyle) {
        if windowStyle == .volume {
            backgroundMaterial = .Transparent
        } else {
            backgroundMaterial = .None
        }
    }

    enum SceneStateKind: String {
        // default value
        case idle
        // when SpatialScene is loading
        case pending
        // when SpatialScen will visible after some time
        case willVisible
        // when SpatialScen load Succesfully
        case visible
        // when SpatialScen Failed to load
        case fail
    }

    var state: SceneStateKind = .idle

    // TOPIC end

    var spatialWebViewModel: SpatialWebViewModel

    init(
        _ url: String,
        _ windowStyle: WindowStyle,
        _ state: SceneStateKind,
        _ sceneOptions: SceneOptions?
    ) {
        self.windowStyle = windowStyle
        self.url = url
        spatialWebViewModel = SpatialWebViewModel(url: url)
        super.init()
        resetBackgroundMaterialOnWindowStyleChange(windowStyle)

        setupSpatialWebView()

        moveToState(state, sceneOptions)
    }

    // used to send message to spatial root webview
    func sendWebMsg(_ id: String, _ msg: Encodable) {
        spatialWebViewModel.sendWebEvent(id, msg)
    }

    private func setupSpatialWebView() {
        setupJSBListeners()
        setupWebViewStateListener()
    }

    private func handleNavigationCheck(_ url: URL) -> Bool {
        // url in scope should open in place
        return true
    }

    private func handleWindowOpenCustom(_ url: URL) -> WebViewElementInfo? {
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

        if let encodedConfig = queryItems.first(where: { $0.name == "config" })?.value,
           let decodedConfig = encodedConfig.removingPercentEncoding
        {
            // open new Scene with Config
            let decoder = JSONDecoder()
            guard let configData = decodedConfig.data(using: .utf8) else {
                print("❌ no config key")
                // should not go here
                return nil
            }

            if decodedConfig == "undefined" || decodedConfig == "null" {
                // no scene config, need to create pending SpatialScene
                let newScene = SpatialApp.Instance.createScene(
                    decodedUrl,
                    .window,
                    .pending,
                    nil
                )

                return WebViewElementInfo(
                    id: newScene.id,
                    element: newScene.spatialWebViewModel
                )
            } else {
                do {
                    let config: XSceneOptionsJSB = try decoder.decode(XSceneOptionsJSB.self, from: configData)

                    let sceneType = config.type ?? .window

                    let newScene = SpatialApp.Instance.createScene(
                        decodedUrl,
                        sceneType,
                        .willVisible,
                        SceneOptions(config)
                    )

                    return WebViewElementInfo(
                        id: newScene.id,
                        element: newScene.spatialWebViewModel
                    )

                } catch {
                    print("❌ config JSON decode fail: \(decodedConfig)")
                    return nil
                }
            }

        } else {
            return nil
        }
    }

    private func handleWindowClose() {
        print("window.close")
        SpatialApp.Instance.closeWindowGroup(self)
    }

    var sceneConfig: SceneOptions?

    func moveToState(_ newState: SceneStateKind, _ sceneConfig: SceneOptions?) {
        print(" moveToState \(state) to \(newState) ")

        let oldState = state
        state = newState

        if sceneConfig != nil {
            self.sceneConfig = sceneConfig
        }

        if oldState == .idle, newState == .pending {
            SpatialApp.Instance.openLoadingUI(self, true)
        } else if oldState == .pending, newState == .willVisible {
            SpatialApp.Instance.openLoadingUI(self, false)
            // hack to fix windowGroup floating, we need it stay in place of loadingView
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                SpatialApp.Instance
                    .openWindowGroup(self, sceneConfig!)
            }

        } else if oldState == .idle, newState == .visible {
            // SpatialApp opened SpatialScene
        } else if oldState == .idle, newState == .willVisible {
            // window.open with scene config
            SpatialApp.Instance.openWindowGroup(self, sceneConfig!)
        }
    }

    private func setupJSBListeners() {
        spatialWebViewModel.addJSBListener(GetSpatialSceneStateCommand.self, onGetSpatialSceneState)
        spatialWebViewModel.addJSBListener(InspectCommand.self, onInspect)
        spatialWebViewModel.addJSBListener(UpdateSceneConfigCommand.self, onUpdateSceneConfig)
        spatialWebViewModel
            .addJSBListener(
                FocusSceneCommand.self,
                onFocusScene
            )

        spatialWebViewModel.addJSBListener(DestroyCommand.self, onDestroySpatialObjectCommand)

        spatialWebViewModel.addJSBListener(UpdateSpatialSceneProperties.self, onUpdateSpatialSceneProperties)

        spatialWebViewModel.addJSBListener(AddSpatializedElementToSpatialScene.self, onAddSpatializedElement)

        spatialWebViewModel.addJSBListener(UpdateSpatialized2DElementProperties.self, onUpdateSpatialized2DElementProperties)

        spatialWebViewModel.addJSBListener(UpdateSpatializedElementTransform.self, onUpdateSpatializedElementTransform)

        spatialWebViewModel.addJSBListener(AddSpatializedElementToSpatialized2DElement.self, onAddSpatializedElementToSpatialized2DElement)

        spatialWebViewModel.addJSBListener(UpdateSpatializedStatic3DElementProperties.self, onUpdateSpatializedStatic3DElementProperties)

        spatialWebViewModel.addJSBListener(CreateSpatializedStatic3DElement.self, onCreateSpatializedStatic3DElement)

        spatialWebViewModel.addJSBListener(CreateSpatializedDynamic3DElement.self, onCreateSpatializedDynamic3DElement)
        spatialWebViewModel.addJSBListener(UpdateSpatializedDynamic3DElementProperties.self, onUpdateSpatializedDynamic3DElementProperties)
        spatialWebViewModel.addJSBListener(CreateSpatialEntity.self, onCreateEntity)
        spatialWebViewModel.addJSBListener(CreateGeometryProperties.self, onCreateGeometry)
        spatialWebViewModel.addJSBListener(CreateUnlitMaterial.self, onCreateUnlitMaterial)
        spatialWebViewModel.addJSBListener(CreateModelComponent.self, onCreateModelComponent)
        spatialWebViewModel.addJSBListener(AddComponentToEntity.self, onAddComponentToEntity)
        spatialWebViewModel.addJSBListener(AddEntityToDynamic3D.self, onAddEntityToDynamic3D)
        spatialWebViewModel.addJSBListener(AddEntityToEntity.self, onAddEntityToEntity)
        spatialWebViewModel.addJSBListener(SetParentForEntity.self, onSetParentForEntity)
        spatialWebViewModel.addJSBListener(RemoveEntityFromParent.self, onRemoveEntityFromParent)
        spatialWebViewModel.addJSBListener(UpdateEntityProperties.self, onUpdateEntityProperties)
        spatialWebViewModel.addJSBListener(CreateModelAsset.self, onCreateModelAsset)
        spatialWebViewModel.addJSBListener(CreateSpatialModelEntity.self, onCreateSpatialModelEntity)
        spatialWebViewModel.addJSBListener(UpdateEntityEvent.self, onUpdateEntityEvent)
        spatialWebViewModel.addJSBListener(ConvertFromEntityToEntity.self, onConvertFromEntityToEntity)
        spatialWebViewModel.addJSBListener(ConvertFromEntityToScene.self, onConvertFromEntityToScene)
        spatialWebViewModel.addJSBListener(ConvertFromSceneToEntity.self, onConvertFromSceneToEntity)

        spatialWebViewModel.addOpenWindowListener(protocal: "webspatial", onOpenWindowHandler)

        spatialWebViewModel
            .addNavigationListener(protocal: SpatialApp.Instance.scope, event: handleNavigationCheck)
    }

    var width: Double = 0

    var height: Double = 0

    var depth: Double = 0

    static let navHeight = 60.0

    func updateSize3D(_ size: Size3D) {
        width = size.width
        height = size.height
        depth = size.depth

        // write through
        spatialWebViewModel.updateWindowKV([
            "innerDepth": depth,
            "outerDepth": depth,
            "outerHeight": height + SpatialScene.navHeight,
        ])
    }

    var didFailLoad = false

    private func setupWebViewStateListener() {
        spatialWebViewModel.addStateListener(.didStartLoad) {
            self.didFailLoad = false
            self.onPageStartLoad()
        }

        spatialWebViewModel.addScrollUpdateListener { _, point in
            self._scrollOffset.x = point.x
            self._scrollOffset.y = point.y
        }

        spatialWebViewModel.addStateListener(.didClose) {
            self.handleWindowClose()
        }

        spatialWebViewModel.addStateListener(.didFailLoad) {
            self.didFailLoad = true
        }

        spatialWebViewModel.addStateListener(.didFinishLoad) {
            if self.state == .pending {
                self.checkHookExist()
            }
        }
    }

    private func checkHookExist(_ completion: ((Bool) -> Void)? = nil) {
        let js = """
        (function() {
            return typeof window.xrCurrentSceneDefaults !== 'undefined';
        })();
        """

        spatialWebViewModel.evaluateJS(js) { result in
            let exists = result as? Bool ?? false

            if let completion = completion {
                completion(exists)
            } else {
                if !exists {
                    self.moveToState(.willVisible, defaultSceneConfig)
                }
            }
        }
    }

    private func onOpenWindowHandler(url: URL) -> WebViewElementInfo? {
        let host = url.host ?? ""
        if host == "createSpatialScene" {
            return handleWindowOpenCustom(url)
        } else {
            let spatialized2DElement: Spatialized2DElement = createSpatializedElement(
                .Spatialized2DElement
            )
            return WebViewElementInfo(id: spatialized2DElement.id, element: spatialized2DElement.getWebViewModel())
        }
    }

    private func onPageStartLoad() {
        // destroy all SpatialObject asset
        let spatialObjectArray = spatialObjects.map { $0.value }
        for spatialObject in spatialObjectArray {
            spatialObject.destroy()
        }
        backgroundMaterial = .None
    }

    private func onGetSpatialSceneState(
        command: GetSpatialSceneStateCommand,
        resolve: @escaping JSBManager.ResolveHandler<Encodable>
    ) {
        resolve(.success(CustomReplyData(type: "state", name: state.rawValue)))
    }

    private func onInspect(command: InspectCommand, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        if let targetId = command.id, !targetId.isEmpty {
            if let spatialObject: SpatialObject = findSpatialObject(targetId) {
                resolve(.success(spatialObject))
                return
            } else if let spatialEntity: SpatialEntity = findSpatialObject(targetId) {
                resolve(.success(spatialEntity))
                return
            } else {
                resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "invalid inspect spatial object id not exsit!")))
                return
            }
        } else {
            // inspect current SpatialScene
            resolve(.success(self))
            return
        }
    }

    private func onDestroySpatialObjectCommand(command: DestroyCommand, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        if let spatialObject: SpatialObject = findSpatialObject(command.id) {
            spatialObject.destroy()
            resolve(.success(nil))
            return
        } else if let spatialEntity: SpatialEntity = findSpatialObject(command.id) {
            spatialEntity.destroy()
            resolve(.success(nil))
            return
        } else {
            resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "Failed to destroy SpatialObject: invalid inspect spatial object id \(command.id) not exsit!")))
            return
        }
    }

    private func onCreateSpatializedStatic3DElement(command: CreateSpatializedStatic3DElement, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        let spatialObject: SpatializedStatic3DElement = createSpatializedElement(.SpatializedStatic3DElement)
        spatialObject.modelURL = command.modelURL

        resolve(.success(AddSpatializedElementReply(id: spatialObject.id)))
    }

    private func onCreateSpatializedDynamic3DElement(command: CreateSpatializedDynamic3DElement, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        let spatialObject: SpatializedDynamic3DElement = createSpatializedElement(.SpatializedDynamic3DElement)

        resolve(.success(AddSpatializedElementReply(id: spatialObject.id)))
    }

    private func onUpdateSpatializedDynamic3DElementProperties(command: UpdateSpatializedDynamic3DElementProperties, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        guard let spatializedElement: SpatializedDynamic3DElement = findSpatialObject(command.id) else {
            resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "invalid updateSpatializedDynamic3DElement spatial object id not exsit!")))
            return
        }
        updateSpatializedElementProperties(spatializedElement, command)
        resolve(.success(baseReplyData))
    }

    private func onUpdateSpatialSceneProperties(command: UpdateSpatialSceneProperties, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        if let material = command.material {
            backgroundMaterial = material
        }

        if let cornerRadius = command.cornerRadius {
            self.cornerRadius = cornerRadius
        }

        if let opacity = command.opacity {
            self.opacity = opacity
        }
        resolve(.success(baseReplyData))
    }

    private func onUpdateSpatializedStatic3DElementProperties(command: UpdateSpatializedStatic3DElementProperties, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        guard let spatializedElement: SpatializedStatic3DElement = findSpatialObject(command.id) else {
            resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "invalid updateSpatializedStatic3DElement spatial object id not exsit!")))
            return
        }

        updateSpatializedElementProperties(spatializedElement, command)

        if let modelURL = command.modelURL {
            spatializedElement.modelURL = modelURL
        }

        if let array = command.modelTransform {
            guard array.count == 16 else {
                print("Received modelTransform matrix array does not have 16 elements.")
                return resolve(.failure(JsbError(code: .InvalidMatrix, message: "invalid UpdateSpatializedStatic3DElementProperties matrix should have length 16!")))
            }

            let column0 = simd_double4(array[0], array[1], array[2], array[3])
            let column1 = simd_double4(array[4], array[5], array[6], array[7])
            let column2 = simd_double4(array[8], array[9], array[10], array[11])
            let column3 = simd_double4(array[12], array[13], array[14], array[15])
            let simd_double4x4 = simd_double4x4(columns: (column0, column1, column2, column3))
            let affineTransform3D = AffineTransform3D(truncating: simd_double4x4)
            spatializedElement.modelTransform = affineTransform3D
        }

        resolve(.success(baseReplyData))
    }

    private func onFocusScene(
        command: FocusSceneCommand,
        resolve: @escaping JSBManager.ResolveHandler<Encodable>
    ) {
        let sceneId = command.id
        print("onFocusScene \(sceneId)")

        if let targetScene = SpatialApp.Instance.getScene(sceneId) {
            SpatialApp.Instance.focusScene(targetScene)
        }

        resolve(.success(baseReplyData))
    }

    private func onUpdateSceneConfig(command: UpdateSceneConfigCommand, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        if state == .visible || state == .willVisible {
            print("forbidden to update scene config after visible")
            // prevent re-enter
            resolve(.success(baseReplyData))
            return
        }

        let sceneConfigJSBData = command.config
        print("onUpdateSceneConfig \(command.config)")

        // find scene
        let sceneConfig = SceneOptions(sceneConfigJSBData)

        // update sceneType
        windowStyle = sceneConfigJSBData.type!

        moveToState(.willVisible, sceneConfig)

        resolve(.success(baseReplyData))
    }

    private func onAddSpatializedElementToSpatialized2DElement(command: AddSpatializedElementToSpatialized2DElement, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        guard let spatialized2DElement: Spatialized2DElement = findSpatialObject(command.id)
        else {
            resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "invalid AddSpatializedElementToSpatialized2DElement spatial object id not exsit!")))
            return
        }

        guard let targetSpatializedElement: SpatializedElement = findSpatialObject(command.spatializedElementId) else {
            resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "invalid AddSpatializedElementToSpatialized2DElement target spatial object id not exsit!")))
            return
        }

        targetSpatializedElement.setParent(spatialized2DElement)
        resolve(.success(baseReplyData))
    }

    private func onUpdateSpatialized2DElementProperties(command: UpdateSpatialized2DElementProperties, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        guard let spatialized2DElement: Spatialized2DElement = findSpatialObject(command.id) else {
            resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "invalid updateSpatializedElementProperties spatial object id not exsit!")))
            return
        }
        updateSpatializedElementProperties(spatialized2DElement, command)
        if let scrollPageEnabled = command.scrollPageEnabled {
            spatialized2DElement.scrollPageEnabled = scrollPageEnabled
        }
        if let material = command.material {
            spatialized2DElement.backgroundMaterial = material
        }

        if let cornerRadius = command.cornerRadius {
            spatialized2DElement.cornerRadius = cornerRadius
        }

        if let scrollEdgeInsetsMarginRight = command.scrollEdgeInsetsMarginRight {
            spatialized2DElement.scrollEdgeInsetsMarginRight = scrollEdgeInsetsMarginRight
        }

        resolve(.success(baseReplyData))
    }

    private func updateSpatializedElementProperties(_ spatializedElement: SpatializedElement, _ command: SpatializedElementProperties) {
        if let name = command.name {
            spatializedElement.name = name
        }

        if let clientX = command.clientX {
            spatializedElement.clientX = clientX
        }

        if let clientY = command.clientY {
            spatializedElement.clientY = clientY
        }

        if let width = command.width {
            spatializedElement.width = width
        }

        if let height = command.height {
            spatializedElement.height = height
        }

        if let depth = command.depth {
            spatializedElement.depth = depth
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

        if let enableTapGesture = command.enableTapGesture {
            spatializedElement.enableTapGesture = enableTapGesture
        }

        if let enableDragStartGesture = command.enableDragStartGesture {
            spatializedElement.enableDragStartGesture = enableDragStartGesture
        }

        if let enableDragGesture = command.enableDragGesture {
            spatializedElement.enableDragGesture = enableDragGesture
        }
        if let enableDragEndGesture = command.enableDragEndGesture {
            spatializedElement.enableDragEndGesture = enableDragEndGesture
        }
        if let enableRotateStartGesture = command.enableRotateStartGesture {
            spatializedElement.enableRotateStartGesture = enableRotateStartGesture
        }
        if let enableRotateGesture = command.enableRotateGesture {
            spatializedElement.enableRotateGesture = enableRotateGesture
        }
        if let enableRotateEndGesture = command.enableRotateEndGesture {
            spatializedElement.enableRotateEndGesture = enableRotateEndGesture
        }

        if let enableMagnifyStartGesture = command.enableMagnifyStartGesture {
            spatializedElement.enableMagnifyStartGesture = enableMagnifyStartGesture
        }

        if let enableMagnifyGesture = command.enableMagnifyGesture {
            spatializedElement.enableMagnifyGesture = enableMagnifyGesture
        }
        if let enableMagnifyEndGesture = command.enableMagnifyEndGesture {
            spatializedElement.enableMagnifyEndGesture = enableMagnifyEndGesture
        }
    }

    private func onUpdateSpatializedElementTransform(command: UpdateSpatializedElementTransform, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        guard let spatializedElement: SpatializedElement = findSpatialObject(command.id) else {
            resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "invalid UpdateSpatializedElementTransform spatial object id not exsit!")))
            return
        }

        let array = command.matrix

        guard array.count == 16 else {
            print("Received matrix array does not have 16 elements.")
            return resolve(.failure(JsbError(code: .InvalidMatrix, message: "invalid UpdateSpatializedElementTransform matrix should have length 16!")))
        }

        let column0 = simd_double4(array[0], array[1], array[2], array[3])
        let column1 = simd_double4(array[4], array[5], array[6], array[7])
        let column2 = simd_double4(array[8], array[9], array[10], array[11])
        let column3 = simd_double4(array[12], array[13], array[14], array[15])
        let simd_double4x4 = simd_double4x4(columns: (column0, column1, column2, column3))
        let affineTransform3D = AffineTransform3D(truncating: simd_double4x4)
        spatializedElement.transform = affineTransform3D

        resolve(.success(baseReplyData))
    }

    private func onAddSpatializedElement(command: AddSpatializedElementToSpatialScene, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        guard let spatializedElement: SpatializedElement = findSpatialObject(command.spatializedElementId) else {
            resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "invalid addSpatializedElementCommand spatial object id not exsit!")))
            return
        }

        spatializedElement.setParent(self)
        resolve(.success(baseReplyData))
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

    func getChildren() -> [String: SpatializedElement] {
        return children
    }

    /*
     * End Implement SpatializedElementContainer Protocol
     */

    /*
     * Begin Implement SpatialScrollAble Protocol
     */
    let scrollPageEnabled: Bool = true

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
            if windowStyle == .volume {
                // default background for volume scene is transparent
                spatialWebViewModel
                    .setBackgroundTransparent(true)
            } else {
                spatialWebViewModel.setBackgroundTransparent(_backgroundMaterial != .None)
            }
        }
    }

    var cornerRadius: CornerRadius = .init()

    var opacity: Double = 1.0

    func getView() -> SpatialWebView {
        return spatialWebViewModel.getView()
    }

    /*
     * Begin SpatialObjects management
     */

    // Resources that will be destroyed when this webpage is destoryed or if it is navigated away from
    private var spatialObjects = [String: any SpatialObjectProtocol]()

    func createSpatializedElement<T: SpatializedElement>(_ type: SpatializedElementType) -> T {
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

    private func onCreateGeometry(command: CreateGeometryProperties, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        if let geometry = Dynamic3DManager.createGeometry(command) {
            addSpatialObject(geometry)
            resolve(.success(AddSpatializedElementReply(id: geometry.id)))
            return
        }

        var message = "invalid geometry params"
        if let gtype = GeometryType(rawValue: command.type) {
            switch gtype {
            case .BoxGeometry:
                var missing: [String] = []
                if command.width == nil { missing.append("width") }
                if command.height == nil { missing.append("height") }
                if command.depth == nil { missing.append("depth") }
                if !missing.isEmpty {
                    message = "missing required fields for BoxGeometry: " + missing.joined(separator: ", ")
                }
            case .PlaneGeometry:
                var missing: [String] = []
                if command.width == nil { missing.append("width") }
                if command.height == nil { missing.append("height") }
                if !missing.isEmpty {
                    message = "missing required fields for PlaneGeometry: " + missing.joined(separator: ", ")
                }
            case .SphereGeometry:
                var missing: [String] = []
                if command.radius == nil { missing.append("radius") }
                if !missing.isEmpty {
                    message = "missing required fields for SphereGeometry: " + missing.joined(separator: ", ")
                }
            case .ConeGeometry:
                var missing: [String] = []
                if command.radius == nil { missing.append("radius") }
                if command.height == nil { missing.append("height") }
                if !missing.isEmpty {
                    message = "missing required fields for ConeGeometry: " + missing.joined(separator: ", ")
                }
            case .CylinderGeometry:
                var missing: [String] = []
                if command.radius == nil { missing.append("radius") }
                if command.height == nil { missing.append("height") }
                if !missing.isEmpty {
                    message = "missing required fields for CylinderGeometry: " + missing.joined(separator: ", ")
                }
            }
        } else {
            message = "invalid geometry type: \(command.type)"
        }

        resolve(.failure(JsbError(code: .InvalidSpatialObject, message: message)))
    }

    private func onCreateEntity(command: CreateSpatialEntity, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        let entity = Dynamic3DManager.createEntity(command)
        addSpatialObject(entity)
        resolve(.success(AddSpatializedElementReply(id: entity.spatialId)))
    }

    private func onCreateComponent() {
        //      @fukang: add Component here
    }

    private func onCreateUnlitMaterial(command: CreateUnlitMaterial, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        let material = Dynamic3DManager.createUnlitMaterial(command, nil)
        addSpatialObject(material)
        resolve(.success(AddSpatializedElementReply(id: material.id)))
    }

    private func onCreateModelComponent(command: CreateModelComponent, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        if let geometry = spatialObjects[command.geometryId] as? Geometry {
            var materials: [SpatialMaterial] = []
            for mid in command.materialIds {
                if let material = spatialObjects[mid] as? SpatialMaterial {
                    materials.append(material)
                } else {
                    print("material \(mid) not found ")
                }
            }
            let component = Dynamic3DManager.createModelComponent(mesh: geometry, mats: materials)
            addSpatialObject(component)
            resolve(.success(AddSpatializedElementReply(id: component.id)))
        } else {
            print("geometry \(command.geometryId) not found")
            resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "geometry \(command.geometryId) not found")))
        }
    }

    private func onAddComponentToEntity(command: AddComponentToEntity, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        if let entity = spatialObjects[command.entityId] as? SpatialEntity,
           let component = spatialObjects[command.componentId] as? SpatialComponent
        {
            entity.addComponent(component)
            resolve(.success(baseReplyData))
            return
        }
        resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "Add component failed")))
    }

    private func onAddEntityToDynamic3D(command: AddEntityToDynamic3D, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        if let entity = spatialObjects[command.entityId] as? SpatialEntity,
           let dynamic3dElement = spatialObjects[command.dynamic3dId] as? SpatializedDynamic3DElement
        {
            dynamic3dElement.addEntity(entity)
            resolve(.success(baseReplyData))
            return
        }
        resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "Add Entity failed")))
    }

    private func onAddEntityToEntity(command: AddEntityToEntity, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        if let entityChild = spatialObjects[command.childId] as? SpatialEntity,
           let entityParent = spatialObjects[command.parentId] as? SpatialEntity
        {
            entityParent.addChild(entity: entityChild)
            resolve(.success(baseReplyData))
            return
        }
        resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "Add Entity failed")))
    }

    private func onSetParentForEntity(command: SetParentForEntity, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        if let entity = spatialObjects[command.childId] as? SpatialEntity {
            if let parentId = command.parentId {
                if let parentEntity = spatialObjects[parentId] as? SpatialEntity {
                    parentEntity.addChild(entity: entity)
                } else if let container = spatialObjects[parentId] as? SpatializedDynamic3DElement {
                    container.addEntity(entity)
                } else {
                    resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "Parent \(parentId) not found")))
                    return
                }
                resolve(.success(baseReplyData))
                return
            } else {
                entity.removeFromParent()
                resolve(.success(baseReplyData))
                return
            }
        }
        resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "Entity \(command.childId) not found")))
    }

    private func onRemoveEntityFromParent(command: RemoveEntityFromParent, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        if let entity = spatialObjects[command.entityId] as? SpatialEntity {
            if entity.parent != nil,
               let parentEntity = entity.parent as? SpatialEntity
            {
                parentEntity.removeChild(id: entity.spatialId)
                resolve(.success(baseReplyData))
                return
            }
            resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "Parent not found")))
            return
        }
        resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "Entity not found")))
    }

    private func onUpdateEntityProperties(command: UpdateEntityProperties, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        if let entity = spatialObjects[command.entityId] as? SpatialEntity,
           command.transform.count == 16
        {
            entity.updateTransform(command.transform)
            resolve(.success(baseReplyData))
            return
        }
        resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "Update Entity failed")))
    }

    private func onCreateModelAsset(command: CreateModelAsset, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        _ = SpatialModelResource(command.url) { onload in
            switch onload {
            case let .success(modelResource):
                self.addSpatialObject(modelResource)
                resolve(.success(AddSpatializedElementReply(id: modelResource.id)))
            case let .failure(error):
                resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "Failed to download model: \(error)")))
            }
        }
    }

    private func onCreateSpatialModelEntity(command: CreateSpatialModelEntity, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        if let modelAsset = spatialObjects[command.modelAssetId] as? SpatialModelResource {
            let spatialModelEntity = SpatialModelEntity(modelAsset, command.name ?? "")
            addSpatialObject(spatialModelEntity)
            resolve(.success(AddSpatializedElementReply(id: spatialModelEntity.spatialId)))
            return
        }
        resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "ModelAsset not found")))
    }

    private func onUpdateEntityEvent(command: UpdateEntityEvent, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        guard let entity = spatialObjects[command.entityId] as? SpatialEntity else {
            resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "Entity not found")))
            return
        }
        entity.updateGesture(command.type, command.isEnable)
        resolve(.success(baseReplyData))
    }

    private func onConvertFromEntityToEntity(command: ConvertFromEntityToEntity, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        guard let fromEntity = spatialObjects[command.fromEntityId] as? SpatialEntity else {
            resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "Entity \(command.fromEntityId) not found")))
            return
        }

        guard let toEntity = spatialObjects[command.toEntityId] as? SpatialEntity else {
            resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "Entity \(command.toEntityId) not found")))
            return
        }
        let position = SIMD3<Float>(Float(command.position.x), Float(command.position.y), Float(command.position.z))
        let point = fromEntity.convert(position: position, to: toEntity)
        resolve(.success(ConvertReply(id: command.fromEntityId, position: point)))
    }

    private func onConvertFromEntityToScene(command: ConvertFromEntityToScene, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        guard let fromEntity = spatialObjects[command.fromEntityId] as? SpatialEntity else {
            resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "Entity \(command.fromEntityId) not found")))
            return
        }
        let position = SIMD3<Float>(Float(command.position.x), Float(command.position.y), Float(command.position.z))
        let point = fromEntity.convert(position: position, to: nil)
        resolve(.success(ConvertReply(id: command.fromEntityId, position: point)))
    }

    private func onConvertFromSceneToEntity(command: ConvertFromSceneToEntity, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        guard let entity = spatialObjects[command.entityId] as? SpatialEntity else {
            resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "Entity \(command.entityId) not found")))
            return
        }
        let position = SIMD3<Float>(Float(command.position.x), Float(command.position.y), Float(command.position.z))
        let point = entity.convert(position: position, from: nil)
        resolve(.success(ConvertReply(id: command.entityId, position: point)))
    }

    private func addSpatialObject(_ object: any SpatialObjectProtocol) {
        var spatialObject = object
        spatialObjects[spatialObject.spatialId] = spatialObject
        spatialObject
            .on(
                event: SpatialObject.Events.BeforeDestroyed.rawValue,
                listener: onSptatialObjectDestroyed
            )
    }

    private func onSptatialObjectDestroyed(_ object: Any, _ data: Any) {
        var spatialObject = object as! (any SpatialObjectProtocol)
        spatialObject
            .off(
                event: SpatialObject.Events.BeforeDestroyed.rawValue,
                listener: onSptatialObjectDestroyed
            )
        spatialObjects.removeValue(forKey: spatialObject.spatialId)

        // notify web side, spatialObject is destroyed
        sendWebMsg(spatialObject.spatialId, SpatialObjectDestroiedEvent())
    }

    func findSpatialObject<T: SpatialObjectProtocol>(_ id: String) -> T? {
        return spatialObjects[id] as? T
    }

    /*
     * End SpatialObjects management
     */

    override func onDestroy() {
        let spatialObjectArray = spatialObjects.map { $0.value }
        for spatialObject in spatialObjectArray {
            spatialObject.destroy()
        }
        spatialWebViewModel.destroy()
    }

    enum CodingKeys: String, CodingKey {
        case children, url, backgroundMaterial, cornerRadius, scrollOffset, webviewIsOpaque, spatialObjectCount, spatialObjectRefCount, spatialObjectList
    }

    override func encode(to encoder: Encoder) throws {
        try super.encode(to: encoder)
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(spatialWebViewModel.url, forKey: .url)
        try container.encode(backgroundMaterial, forKey: .backgroundMaterial)
        try container.encode(cornerRadius, forKey: .cornerRadius)
        try container.encode(scrollOffset, forKey: .scrollOffset)
        try container.encode(children, forKey: .children)

        // for debug only
        try container.encode(spatialWebViewModel.getController().webview?.isOpaque, forKey: .webviewIsOpaque)
        try container.encode(SpatialObject.objects.count, forKey: .spatialObjectCount)

        let spatialObjectList = SpatialObject.objects.map { object in
            ["id": object.key, "type": String(describing: type(of: object.value))]
        }
        try container.encode(spatialObjectList, forKey: .spatialObjectList)

        try container.encode(SpatialObjectWeakRefManager.weakRefObjects.count, forKey: .spatialObjectRefCount)
    }
}

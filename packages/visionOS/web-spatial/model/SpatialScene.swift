import Combine
import Foundation
import SwiftUI

struct SceneData: Decodable, Hashable, Encodable {
    let sceneID: String
}

struct CustomReplyData: Codable {
    let type: String
    let name: String
}

struct AddSpatializedStatic3DElementReply: Codable {
    let id: String
}  
struct ResizeRange: Codable {
    var minWidth: Double?
    var minHeight: Double?
    var maxWidth: Double?
    var maxHeight: Double?
}
struct UpdateSpatializedStatic3DElementReply: Codable {
    let id: String
}

let baseReplyData = CustomReplyData(type: "BasicData", name: "jsb call back")


@Observable
class SpatialScene: SpatialObject, ScrollAbleSpatialElementContainer, WebMsgSender {
    var parent: (any ScrollAbleSpatialElementContainer)? = nil
    
    // Enum
    public enum WindowStyle: String, Codable, CaseIterable {
        case plain    = "Plain"
        case volume    = "Volume"
    }
    
    // TOPIC begin
    var openWindowData = PassthroughSubject<String, Never>()
    var closeWindowData = PassthroughSubject<String, Never>()

    var setLoadingWindowData = PassthroughSubject<XLoadingViewData, Never>()

    var url: String = "" // start_url
    var windowStyle:WindowStyle = .plain

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

    init(_ url: String, _ windowStyle: WindowStyle, _ state: SceneStateKind, _ sceneOptions: XPlainSceneOptions?) {
        self.windowStyle = windowStyle
        self.url = url
        spatialWebViewModel = SpatialWebViewModel(url: url)
        super.init()

        setupSpatialWebView()
        
        self.moveToState(state, sceneOptions)
    }
    
    // used to send message to spatial root webview
    func sendWebMsg(_ id: String, _ msg: Encodable) {
        spatialWebViewModel.sendWebEvent(id, msg)
    }

    private func setupSpatialWebView() {
        setupJSBListeners()
        setupWebViewStateListner()
    }
    
    private func handleNavigationCheck(_ url:URL) -> Bool {
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
        
        if  let encodedConfig = queryItems.first(where: { $0.name == "config" })?.value,
            let decodedConfig = encodedConfig.removingPercentEncoding {
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
                    .plain,
                    .pending,
                    nil
                )
                
                return WebViewElementInfo(
                    id: newScene.id,
                    element: newScene.spatialWebViewModel
                )
            } else {
                do {
                    let config: XSceneOptionsJSB  = try decoder.decode(XSceneOptionsJSB.self, from: configData)
                    
                    let newScene = SpatialApp.Instance.createScene(
                        decodedUrl,
                        .plain,
                        .willVisible,
                        XPlainSceneOptions(config)
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

    public func moveToState(_ newState: SceneStateKind, _ sceneConfig: XPlainSceneOptions?) {
        print(" moveToState \(self.state) to \(newState) ")

        
        let oldState = self.state
        state = newState

        if oldState == .idle &&  newState == .pending {
            SpatialApp.Instance.openLoadingUI(self,true)
        }  else if oldState == .pending &&  newState == .willVisible {
            SpatialApp.Instance.openLoadingUI(self,false)
            // hack to fix windowGroup floating, we need it stay in place of loadingView
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                SpatialApp.Instance.openWindowGroup(self, sceneConfig!, {
                    [weak self] in
                    self?.moveToState(.visible, nil)
                })
            }
            
        } else if oldState == .idle &&  newState == .visible {
            // SpatialApp opened SpatialScene
            
        } else if oldState == .idle &&  newState == .willVisible {
            // window.open with scene config
            SpatialApp.Instance.openWindowGroup(self, sceneConfig!,{
                [weak self] in
                self?.moveToState(.visible, nil)
            })
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
        spatialWebViewModel.addOpenWindowListener(protocal: "webspatial", onOpenWindowHandler)
        
        spatialWebViewModel
            .addNavigationListener(protocal: SpatialApp.Instance.scope, event: handleNavigationCheck)
    }

    private func setupWebViewStateListner() {
        spatialWebViewModel.addStateListener(.didUnload) {
            print("---------------onLeavePageSession---------------")
            self.onLeavePageSession()
        }
        
        spatialWebViewModel.addStateListener(.didStartLoad) {
            self.backgroundMaterial = .None
        }

        spatialWebViewModel.addScrollUpdateListener { _, point in
            self._scrollOffset.x = point.x
            self._scrollOffset.y = point.y
        }

        spatialWebViewModel.addStateListener(.didClose) {
            self.handleWindowClose()
        }
    }
    
    private func onOpenWindowHandler(url: URL) -> WebViewElementInfo? {
        let host = url.host ?? ""
        if host == "createSpatialScene" {
            return self.handleWindowOpenCustom(url)
        } else {
            let spatialized2DElement: Spatialized2DElement = self.createSpatializedElement(
                .Spatialized2DElement
            )
            return WebViewElementInfo(id: spatialized2DElement.id, element: spatialized2DElement.getWebViewModel())
        }
        
    }

    private func onLeavePageSession() {
        // destroy all SpatialObject asset
        let spatialObjectArray = spatialObjects.map { $0.value }
        for spatialObject in spatialObjectArray {
            spatialObject.destroy()
        }
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
        } else {
            resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "Failed to destroy SpatialObject: invalid inspect spatial object id \(command.id) not exsit!")))
            return
        }
    }

    private func onCreateSpatializedStatic3DElement(command: CreateSpatializedStatic3DElement, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        let spatialObject: SpatializedStatic3DElement = createSpatializedElement(.SpatializedStatic3DElement)
        spatialObject.modelURL = command.modelURL

        resolve(.success(AddSpatializedStatic3DElementReply(id: spatialObject.id)))
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

        resolve(.success(baseReplyData))
    }
    
    private func onFocusScene(
        command: FocusSceneCommand,
        resolve: @escaping JSBManager.ResolveHandler<Encodable>
    ){
        let sceneId = command.id
        print("onFocusScene \(sceneId)")
        
        if let targetScene = SpatialApp.Instance.getScene(sceneId) {
            SpatialApp.Instance.focusScene(targetScene)
        }
        
        resolve(.success(baseReplyData))
    }
    
    private func onUpdateSceneConfig(command: UpdateSceneConfigCommand, resolve: @escaping JSBManager.ResolveHandler<Encodable>){
        
        if self.state == .visible || self.state == .willVisible {
            print("forbidden to update scene config after visible")
            // prevent re-enter
            resolve(.success(baseReplyData))
            return
        }
        
        let sceneConfigJSBData = command.config
        print("onUpdateSceneConfig \(command.config)")
        
        // find scene
        let sceneConfig = XPlainSceneOptions(sceneConfigJSBData)

        
        self.moveToState(.willVisible, sceneConfig)
        
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
            spatialized2DElement.cornerRadius = cornerRadius
        }
        
        

        resolve(.success(baseReplyData))
    }

    private func updateSpatializedElementProperties(_ spatializedElement: SpatializedElement, _ command: SpatializedElementProperties) {
        if let name = command.name {
            spatializedElement.name = name
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
        
        if let enableGesture = command.enableGesture {
            spatializedElement.enableGesture = enableGesture
        }
    }

    private func onUpdateSpatializedElementTransform(command: UpdateSpatializedElementTransform, resolve: @escaping JSBManager.ResolveHandler<Encodable>) {
        guard let spatializedElement: SpatializedElement = findSpatialObject(command.id) else {
            resolve(.failure(JsbError(code: .InvalidSpatialObject, message: "invalid UpdateSpatializedElementTransform spatial object id not exsit!")))
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
            spatialWebViewModel.setBackgroundTransparent(_backgroundMaterial != .None)
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
    private var spatialObjects = [String: SpatialObject]()

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
        let spatialObjectArray = spatialObjects.map { $0.value }
        for spatialObject in spatialObjectArray {
            spatialObject.destroy()
        }
        spatialWebViewModel.destroy()
    }

    enum CodingKeys: String, CodingKey {
        case children, url, backgroundMaterial, cornerRadius, scrollOffset, webviewIsOpaque, webviewId, spatialObjectCount, spatialObjectRefCount
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
        try container.encode(spatialWebViewModel.id, forKey: .webviewId)
        try container.encode(SpatialObject.objects.count, forKey: .spatialObjectCount)
        try container.encode(SpatialObjectWeakRefManager.weakRefObjects.count, forKey: .spatialObjectRefCount)
    }
}

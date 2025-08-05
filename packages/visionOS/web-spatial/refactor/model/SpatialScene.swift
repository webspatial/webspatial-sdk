import Foundation

struct CustomReplyData: Codable {
    let type: String
    let name: String
}

struct AddSpatializedStatic3DElementReply: Codable {
    let id: String
}

struct UpdateSpatializedStatic3DElementReply: Codable {
    let id: String
}

let baseReplyData = CustomReplyData(type: "BasicData", name: "jsb call back")

@Observable
class SpatialScene: SpatialObject, ScrollAbleSpatialElementContainer {
    override init(_ url: String) {
        spatialWebViewModel = SpatialWebViewModel(url: url)
        super.init()

        setupSpatialWebView()
    }

    private func setupSpatialWebView() {
        spatialWebViewModel.setBackgroundTransparent(true)
        spatialWebViewModel.load()

        setupJSBListeners()
        setupWebViewStateListner()
    }

    private func setupJSBListeners() {
        spatialWebViewModel.addJSBListener(InspectCommand.self, onInspect)

        spatialWebViewModel.addJSBListener(UpdateSpatialSceneProperties.self, onUpdateSpatialSceneProperties)

        spatialWebViewModel.addJSBListener(AddSpatializedElementToSpatialScene.self, onAddSpatializedElement)

        spatialWebViewModel.addJSBListener(UpdateSpatialized2DElementProperties.self, onUpdateSpatialized2DElementProperties)

        spatialWebViewModel.addJSBListener(UpdateSpatializedElementTransform.self, onUpdateSpatializedElementTransform)

        spatialWebViewModel.addJSBListener(AddSpatializedElementToSpatialized2DElement.self, onAddSpatializedElementToSpatialized2DElement)

        spatialWebViewModel.addJSBListener(UpdateSpatializedStatic3DElementProperties.self, onUpdateSpatializedStatic3DElementProperties)

        spatialWebViewModel.addJSBListener(CreateSpatializedStatic3DElement.self, onCreateSpatializedStatic3DElement)

        spatialWebViewModel.addOpenWindowListener(protocal: "webspatial") { _ in
            let spatialized2DElement: Spatialized2DElement = self.createSpatializedElement(.Spatialized2DElement)
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
        if let scrollEnabled = command.scrollEnabled {
            spatialized2DElement.scrollEnabled = scrollEnabled
        }
        if let material = command.material {
            spatialized2DElement.backgroundMaterial = material
        }

        if let cornerRadius = command.cornerRadius {
            spatialized2DElement.cornerRadius = cornerRadius
        }

        resolve(.success(baseReplyData))
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

    private var spatialWebViewModel: SpatialWebViewModel

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
        case children, url, backgroundMaterial, cornerRadius, scrollOffset
    }

    override func encode(to encoder: Encoder) throws {
        try super.encode(to: encoder)
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(spatialWebViewModel.url, forKey: .url)
        try container.encode(backgroundMaterial, forKey: .backgroundMaterial)
        try container.encode(cornerRadius, forKey: .cornerRadius)
        try container.encode(scrollOffset, forKey: .scrollOffset)
        try container.encode(children, forKey: .children)
    }
}

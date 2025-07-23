import Foundation

@Observable
class SpatialScene2: SpatialObject, ScrollAbleSpatialElementContainer {
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
        return spatialWebViewModel.getView()!
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

import Foundation

@Observable
class SpatialScene: SpatialObject, ScrollAbleSpatialElementContainer {
    override init(_ url: String) {
        spatialWebViewModel = SpatialWebViewModel(url: url)
        super.init()

        spatialWebViewModel.load()

        setupJSBListeners()
    }

    private func setupJSBListeners() {
        spatialWebViewModel.addJSBListener(UpdateSpatialSceneMaterialCommand.self) { command, resolve, _ in
            self.backgroundMaterial = command!.material
            resolve(nil)
        }
        spatialWebViewModel.addJSBListener(UpdateSpatialSceneCorerCommand.self) { command, resolve, _ in
            self.cornerRadius = command!.cornerRadius
            resolve(nil)
        }

        spatialWebViewModel.addJSBListener(PingCommand.self) { _, resolve, _ in
            let data = ReplyData(success: true, message: "ok")
            resolve(data)
        }

        spatialWebViewModel.addOpenWindowListener(protocal: "webspatial") { _ in
            let spatialized2DElement: Spatialized2DElement = self.createSpatializedElement(type: .Spatialized2DElement)
            return spatialized2DElement.getWebViewModel()
        }
    }

    /*
     * Begin Implement SpatializedElementContainer Protocol
     */

    // SpatialScene can hold a collection of SpatializedElement children
    private var children = [String: SpatializedElement]()

    func addChild(_ spatializedElement: SpatializedElement) {
        children[spatializedElement.id] = spatializedElement
        spatializedElement.setParent(self)
    }

    func removeChild(_ spatializedElement: SpatializedElement) {
        spatializedElement.setParent(nil)
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

    func updateScrollOffset(_ delta: Double) {}

    func stopScrolling() {}

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
//            webViewNative?.webViewHolder.appleWebView?.isOpaque = _backgroundMaterial == .None
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

    /*
     * End SpatialObjects management
     */

    override func onDestroy() {
        let spatialObjectArray = spatialObjects.map { $0.value }
        for spatialObject in spatialObjectArray {
            spatialObject.destroy()
        }
        spatialWebViewModel.destory()
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

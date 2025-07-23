import Foundation

@Observable
class SpatialScene: SpatialObject, ScrollAbleSpatialElementContainer {
    override init(_ url: String) {
        spatialWebViewModel = SpatialWebViewModel(url: url)
        super.init()

        spatialWebViewModel.load()
        print("SpatialScene init")
    }

    /*
     * Begin Implement SpatializedElementContainer Protocol
     */

    // Spatialized2DElement can hold a collection of SpatializedElement children
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
            // it's spatial div
//                webViewNative?.webViewHolder.appleWebView?.isOpaque = false
        }
    }

    var cornerRadius: CornerRadius = .init()

    func getView() -> SpatialWebView {
        return spatialWebViewModel.getView()
    }
}

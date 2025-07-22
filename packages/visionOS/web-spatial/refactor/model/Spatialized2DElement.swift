import Foundation
import RealityKit
import SwiftUI

@Observable
class Spatialized2DElement: SpatializedElement, ScrollAbleSpatialElementContainer {
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

    private var _scrollEnabled = false
    var scrollEnabled: Bool {
        get {
            return _scrollEnabled
        }
        set(newValue) {
            _scrollEnabled = newValue
        }
    }

    var zIndex: Double = 0

    var _scrollOffset: Vec2 = .init(x: 0, y: 0)
    var scrollOffset: Vec2 {
        get {
            return _scrollOffset
        }
        set(newValue) {
            _scrollOffset = newValue
        }
    }

    func updateScrollOffset(_ delta: Double) {
        _scrollOffset.y += delta
    }

    func stopScrolling() {
//        webViewNative!.webViewHolder.appleWebView!.scrollView.stopScrollingAndZooming()
    }

    private var spatialWebViewModel: SpatialWebViewModel

    override init() {
        spatialWebViewModel = SpatialWebViewModel(url: nil)

        super.init()
    }

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

    func findNearestScrollEnabledSpatialized2DElement() -> SpatialScrollAble? {
        while let current = parent {
            if current.scrollEnabled {
                return current
            }
        }
        return nil
    }

    func getView() -> SpatialWebView {
        return spatialWebViewModel.getView()
    }

    override func onDestroy() {
        let spatializedElements = children.map { $0.value }
        for spatializedElement in spatializedElements {
            spatializedElement.destroy()
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
            "transform": transform,
            "rotationAnchor": rotationAnchor,
            "scrollEnabled": scrollEnabled,
            "scrollOffset": scrollOffset,
            "zIndex": zIndex,
        ]

        let baseInspectInfo = super.inspect()
        for (key, value) in baseInspectInfo {
            inspectInfo[key] = value
        }
        return inspectInfo
    }
}

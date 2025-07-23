import Foundation
import RealityKit
import SwiftUI

@Observable
class Spatialized2DElement: SpatializedElement, ScrollAbleSpatialElementContainer {
    var cornerRadius: CornerRadius = .init()

    var backgroundMaterial = BackgroundMaterial.None

    private var _scrollEnabled = false
    var scrollEnabled: Bool {
        get {
            return spatialWebViewModel.scrollEnabled
        }
        set(newValue) {
            spatialWebViewModel.scrollEnabled = newValue
        }
    }

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

    private var spatialWebViewModel: SpatialWebViewModel
    func getWebViewModel() -> SpatialWebViewModel {
        return spatialWebViewModel
    }

    override init() {
        spatialWebViewModel = SpatialWebViewModel(url: nil)

        super.init()

        spatialWebViewModel.setBackgroundTransparent(true)
        spatialWebViewModel.addScrollUpdateListener { _, point in
            self._scrollOffset.x = point.x
            self._scrollOffset.y = point.y
        }
    }

    // Spatialized2DElement can hold a collection of SpatializedElement children
    private var children = [String: SpatializedElement]()

    // Called by SpatializedElement.setParent
    func addChild(_ spatializedElement: SpatializedElement) {
        children[spatializedElement.id] = spatializedElement
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

    func loadHtml(_ html: String) {
        spatialWebViewModel.loadHTML(html)
    }

    func getView() -> SpatialWebView {
        return spatialWebViewModel.getView()!
    }

    override func onDestroy() {
        let spatializedElements = children.map { $0.value }
        for spatializedElement in spatializedElements {
            spatializedElement.destroy()
        }
        spatialWebViewModel.destroy()

        super.onDestroy()
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
            "type": SpatializedElementType.Spatialized2DElement,
        ]

        let baseInspectInfo = super.inspect()
        for (key, value) in baseInspectInfo {
            inspectInfo[key] = value
        }
        return inspectInfo
    }
}

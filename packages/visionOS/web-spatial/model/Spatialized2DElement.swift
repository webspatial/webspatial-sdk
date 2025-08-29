import Foundation
import RealityKit
import SwiftUI

@Observable
class Spatialized2DElement: SpatializedElement, ScrollAbleSpatialElementContainer {
    var cornerRadius: CornerRadius = .init()

    var backgroundMaterial = BackgroundMaterial.None

    var scrollPageEnabled = false
    
    var scrollEdgeInsetsMarginRight: CGFloat? {
        get {
            return spatialWebViewModel.getController().webview?.scrollView.contentInset.right
        }
        set(newValue) {
            spatialWebViewModel.getController().webview?.scrollView.contentInset.right = newValue ?? 0
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

    // Called by SpatializedElement.setParent
    func removeChild(_ spatializedElement: SpatializedElement) {
        children.removeValue(forKey: spatializedElement.id)
    }

    func getChildren() -> [String: SpatializedElement] {
        return children
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

    func loadHtml(_ html: String) {
        spatialWebViewModel.loadHTML(html)
    }
    
    func load(_ url: String) {
        spatialWebViewModel.load(url)
    }

    func getView() -> SpatialWebView {
        return spatialWebViewModel.getView()
    }

    override func onDestroy() {
        let spatializedElements = children.map { $0.value }
        for spatializedElement in spatializedElements {
            spatializedElement.destroy()
        }
        spatialWebViewModel.destroy()

        super.onDestroy()
    }

    enum CodingKeys: String, CodingKey {
        case cornerRadius, backgroundMaterial, children, type, scrollOffset, scrollPageEnabled, webviewIsOpaque, webviewId
    }

    override func encode(to encoder: Encoder) throws {
        try super.encode(to: encoder)
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(cornerRadius, forKey: .cornerRadius)
        try container.encode(backgroundMaterial, forKey: .backgroundMaterial)
        try container.encode(children, forKey: .children)
        try container.encode(SpatializedElementType.Spatialized2DElement, forKey: .type)
        try container.encode(scrollOffset, forKey: .scrollOffset)
        try container.encode(scrollPageEnabled, forKey: .scrollPageEnabled)

        // for debug only
        try container.encode(spatialWebViewModel.getController().webview?.isOpaque, forKey: .webviewIsOpaque)
        try container.encode(spatialWebViewModel.id, forKey: .webviewId)

    }
}

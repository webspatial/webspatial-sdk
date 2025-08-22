import RealityKit
import SwiftUI

extension View {
    @ViewBuilder
    func `if`<Content: View>(_ condition: Bool, transform: (Self) -> Content) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }
}

class Spatialized2DViewGestureData {
    var dragStarted = false
    var dragStart: CGFloat = 0.0
    var dragVelocity: CGFloat = 0.0
}

struct Spatialized2DElementView: View {
    @Environment(SpatializedElement.self) var spatializedElement: SpatializedElement

    private var spatialized2DElement: Spatialized2DElement {
        return spatializedElement as! Spatialized2DElement
    }

    @State private var gestureData = Spatialized2DViewGestureData()

    var body: some View {
        let enableGesture = spatializedElement.enableGesture
        // Display child spatialized2DElements
        ZStack(alignment: Alignment.topLeading) {
            // Display the main webview
            spatialized2DElement.getView()
                .materialWithBorderCorner(
                    spatialized2DElement.backgroundMaterial,
                    spatialized2DElement.cornerRadius
                )
                .simultaneousGesture(needBubbleUp ? dragWebGesture: nil)
            
            let childrenOfSpatialized2DElement: [SpatializedElement] = Array(spatialized2DElement.getChildrenOfType(.Spatialized2DElement).values)

            ForEach(childrenOfSpatialized2DElement, id: \.id) { child in
                SpatializedElementView(parentScrollOffset: spatialized2DElement.scrollOffset) {
                    Spatialized2DElementView()
                }
                .environment(child)
            }

            let childrenOfSpatializedStatic3DElement: [SpatializedElement] = Array(spatialized2DElement.getChildrenOfType(.SpatializedStatic3DElement).values)
            ForEach(childrenOfSpatializedStatic3DElement, id: \.id) { child in
                SpatializedElementView(parentScrollOffset: spatialized2DElement.scrollOffset) {
                    SpatializedStatic3DView()
                }
                .environment(child)
            }
        }
    }

    private var needBubbleUp: Bool {
        return !spatialized2DElement.scrollEnabled && spatialized2DElement.scrollWithParent
    }

    private var dragWebGesture: some Gesture {
        DragGesture()
            .onChanged { gesture in
                print("\(spatialized2DElement.name) dragWebGesture")
                if needBubbleUp {
                    // Check if there is a nearest scroll-enabled Spatialized2DElement
                    // and scroll it if it exists
                    if let targetElement = spatialized2DElement.findNearestScrollAbleSpatialElementContainer() {
                        if !gestureData.dragStarted {
                            gestureData.dragStarted = true
                            gestureData.dragStart = (gesture.translation.height)
                        }

                        // TODO: this should have velocity
                        let delta = gestureData.dragStart - gesture.translation.height
                        gestureData.dragStart = gesture.translation.height
                        targetElement.updateDeltaScrollOffset(Vec2(x: 0, y: delta))
                    }
                }
            }
            .onEnded { _ in
                print("\(spatialized2DElement.name) dragWebGestureEnd")
                if needBubbleUp {
                    if let targetElement = spatialized2DElement.findNearestScrollAbleSpatialElementContainer() {
                        gestureData.dragStarted = false
                        gestureData.dragStart = 0
                        targetElement.stopScrolling()
                    }
                }
            }
    }
}

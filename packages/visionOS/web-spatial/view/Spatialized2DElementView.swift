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
    @Environment(SpatialScene.self) var spatialScene: SpatialScene

    private var spatialized2DElement: Spatialized2DElement {
        return spatializedElement as! Spatialized2DElement
    }

    @State private var gestureData = Spatialized2DViewGestureData()

    var body: some View {
        // Display child spatialized2DElements
        ZStack(alignment: Alignment.topLeading) {
            // Display the main webview
            spatialized2DElement.getView()
                .materialWithBorderCorner(
                    spatialized2DElement.backgroundMaterial,
                    spatialized2DElement.cornerRadius
                )
                .simultaneousGesture(spatialized2DElement.scrollPageEnabled ? dragWebGesture : nil)

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
            
            let childrenOfSpatializedDynamic3DElement: [SpatializedElement] = Array(spatialized2DElement.getChildrenOfType(.SpatializedDynamic3DElement).values)
            
            ForEach(childrenOfSpatializedDynamic3DElement, id: \.id) { child in
                SpatializedElementView(parentScrollOffset: spatialized2DElement.scrollOffset) {
                    SpatializedDynamic3DView()
                }
                .environment(child)
            }
        }
    }

    private var dragWebGesture: some Gesture {
        DragGesture()
            .onChanged { gesture in
                print("\(spatialized2DElement.name) dragWebGesture")
                if spatialized2DElement.scrollPageEnabled {
                    if !gestureData.dragStarted {
                        gestureData.dragStarted = true
                        gestureData.dragStart = (gesture.translation.height)
                    }

                    // TODO: this should have velocity
                    let delta = gestureData.dragStart - gesture.translation.height
                    gestureData.dragStart = gesture.translation.height
                    spatialScene.updateDeltaScrollOffset(Vec2(x: 0, y: delta))
                }
            }
            .onEnded { _ in
                print("\(spatialized2DElement.name) dragWebGestureEnd")
                if spatialized2DElement.scrollPageEnabled {
                    gestureData.dragStarted = false
                    gestureData.dragStart = 0
                    spatialScene.stopScrolling()
                }
            }
    }
}

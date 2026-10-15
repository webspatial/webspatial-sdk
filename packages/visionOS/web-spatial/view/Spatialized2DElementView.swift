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
    var dragStart: CGSize = .zero
    var dragVelocity: CGFloat = 0.0
}

func spatialScrollDelta(from previousTranslation: CGSize, to currentTranslation: CGSize) -> Vec2 {
    Vec2(
        x: previousTranslation.width - currentTranslation.width,
        y: previousTranslation.height - currentTranslation.height
    )
}

struct Spatialized2DElementView: View {
    let spatialized2DElement: Spatialized2DElement
    @Environment(SpatialScene.self) var spatialScene: SpatialScene

    @State private var gestureData = Spatialized2DViewGestureData()

    var body: some View {
        // Display child spatialized2DElements
        ZStack(alignment: Alignment.topLeading) {
            // Display the main webview
            spatialized2DElement.getView()
                .materialWithBorderCorner(
                    spatialized2DElement.backgroundMaterial,
                    spatialized2DElement.cornerRadius,
                    .window
                )
                .simultaneousGesture(spatialized2DElement.scrollPageEnabled ? dragWebGesture : nil)

            let childrenOfSpatialized2DElement = spatialized2DElement.getChildren(ofType: Spatialized2DElement.self)

            ForEach(childrenOfSpatialized2DElement, id: \.id) { child in
                SpatializedElementView(parentScrollOffset: spatialized2DElement.scrollOffset, spatializedElement: child) {
                    Spatialized2DElementView(spatialized2DElement: child)
                }
            }

            let childrenOfSpatializedStatic3DElement = spatialized2DElement.getChildren(ofType: SpatializedStatic3DElement.self)
            ForEach(childrenOfSpatializedStatic3DElement, id: \.id) { child in
                SpatializedElementView(parentScrollOffset: spatialized2DElement.scrollOffset, spatializedElement: child) {
                    SpatializedStatic3DView(spatializedStatic3DElement: child)
                }
            }

            let childrenOfSpatializedDynamic3DElement = spatialized2DElement.getChildren(ofType: SpatializedDynamic3DElement.self)

            ForEach(childrenOfSpatializedDynamic3DElement, id: \.id) { child in
                SpatializedElementView(parentScrollOffset: spatialized2DElement.scrollOffset, spatializedElement: child) {
                    SpatializedDynamic3DView(spatializedDynamic3DElement: child)
                }
            }
        }
    }

    private var dragWebGesture: some Gesture {
        DragGesture()
            .onChanged { gesture in
//                print("\(spatialized2DElement.name) dragWebGesture")
                if spatialScene.isSpatialElementGestureActive {
                    return
                }
                if spatialized2DElement.scrollPageEnabled {
                    if !gestureData.dragStarted {
                        gestureData.dragStarted = true
                        gestureData.dragStart = gesture.translation
                    }

                    // TODO: this should have velocity
                    let delta = spatialScrollDelta(
                        from: gestureData.dragStart,
                        to: gesture.translation
                    )
                    gestureData.dragStart = gesture.translation
                    spatialScene.updateDeltaScrollOffset(delta)
                }
            }
            .onEnded { _ in
                print("\(spatialized2DElement.name) dragWebGestureEnd")
                if spatialScene.isSpatialElementGestureActive {
                    return
                }
                if spatialized2DElement.scrollPageEnabled {
                    gestureData.dragStarted = false
                    gestureData.dragStart = .zero
                    spatialScene.stopScrolling()
                }
            }
    }
}

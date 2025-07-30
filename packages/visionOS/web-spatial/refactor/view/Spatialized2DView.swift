import RealityKit
import SwiftUI

class Spatialized2DViewGestureData {
    var dragStarted = false
    var dragStart: CGFloat = 0.0
    var dragVelocity: CGFloat = 0.0
}

struct Spatialized2DView: View {
    @Environment(SpatializedElement.self) var spatializedElement: SpatializedElement

    private var spatialized2DElement: Spatialized2DElement {
        return spatializedElement as! Spatialized2DElement
    }

    @State private var gestureData = Spatialized2DViewGestureData()

    var body: some View {
        // Display child spatialized2DElements
        return ZStack {
            OptionalClip(clipEnabled: spatialized2DElement.scrollEnabled) {
                ZStack {
                    let childrenOfSpatialized2DElement: [SpatializedElement] = Array(spatialized2DElement.getChildrenOfType(.Spatialized2DElement).values)

                    ForEach(childrenOfSpatialized2DElement, id: \.id) { child in
                        SpatializedElementView(parentScrollOffset: spatialized2DElement.scrollOffset) {
                            Spatialized2DView()
                        }
                        .environment(child)
                    }
                }
            }

            // Display the main webview
            spatialized2DElement.getView()
                .materialWithBorderCorner(
                    spatialized2DElement.backgroundMaterial,
                    spatialized2DElement.cornerRadius
                )
                .gesture(dragGesture)
//                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    private var needBubbleUp: Bool {
        return !spatialized2DElement.scrollEnabled && spatialized2DElement.scrollWithParent
    }

    private var dragGesture: some Gesture {
        DragGesture()
            .onChanged { gesture in
                if needBubbleUp {
                    // Check if there is a nearest scroll-enabled Spatialized2DElement
                    // and scroll it if it exists
                    if let targetElement = spatialized2DElement.findNearestScrollEnabledSpatialized2DElement() {
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
                if needBubbleUp {
                    if let targetElement = spatialized2DElement.findNearestScrollEnabledSpatialized2DElement() {
                        gestureData.dragStarted = false
                        gestureData.dragStart = 0
                        targetElement.stopScrolling()
                    }
                }
            }
    }
}

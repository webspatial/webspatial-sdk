import RealityKit
import SwiftUI

class Spatialized2DViewGestureData {
    var isDragging = false
    var dragStarted = false
    var dragStart = 0.0
    var dragVelocity = 0.0
}

struct Spatialized2DView: View {
    @Environment(Spatialized2DElement.self) var spatialized2DElement: Spatialized2DElement

    @State private var gestureData = Spatialized2DViewGestureData()

    var body: some View {
        let parent = spatialized2DElement.parent!
        let parentYOffset = Float(parent.scrollOffset.y)
        let childrenOfSpatialized2DElement: [SpatializedElement] = Array(spatialized2DElement.getChildrenOfType(.Spatialized2DElement).values)

        // Display child spatialized2DElements
        return ZStack {
            OptionalClip(clipEnabled: true && parent.scrollEnabled) {
                ZStack {
                    ForEach(childrenOfSpatialized2DElement, id: \.id) { child in
                        renderChildSpatialized2DElement(for: child, parentYOffset: parentYOffset)
                    }
                }.frame(maxWidth: .infinity, maxHeight: .infinity).frame(maxDepth: 0, alignment: .back).offset(z: 0)
            }

            // Display the main webview
            spatialized2DElement.getView()
                .materialWithBorderCorner(
                    spatialized2DElement.backgroundMaterial,
                    spatialized2DElement.cornerRadius
                )
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .opacity(spatialized2DElement.opacity)
        .hidden(!spatialized2DElement.visible)
    }

    private var dragGesture: some Gesture {
        DragGesture()

            .onChanged { gesture in
                let needBubbleUp = !spatialized2DElement.scrollEnabled
                if needBubbleUp {
                    // Check if there is a nearest scroll-enabled Spatialized2DElement
                    // and scroll it if it exists
                    if let targetSpatialized2DElement = spatialized2DElement.findNearestScrollEnabledSpatialized2DElement() {
                        if !gestureData.dragStarted {
                            gestureData.dragStarted = true
                            gestureData.dragStart = (gesture.translation.height)
                        }

                        // TODO: this should have velocity
                        let delta = gestureData.dragStart - gesture.translation.height
                        gestureData.dragStart = gesture.translation.height
                        targetSpatialized2DElement.updateScrollOffset(delta)
                    }
                }
            }
            .onEnded { _ in
                let needBubbleUp = !spatialized2DElement.scrollEnabled
                if needBubbleUp {
                    if let targetSpatialized2DElement = spatialized2DElement.findNearestScrollEnabledSpatialized2DElement() {
                        gestureData.dragStarted = false
                        gestureData.dragStart = 0
                        targetSpatialized2DElement.stopScrolling()
                    }
                }
            }
    }

    private func renderChildSpatialized2DElement(for child: SpatializedElement, parentYOffset: Float) -> some View {
        let childSpatialized2DElement = child as! Spatialized2DElement
        let transform = child.transform

        let translation = transform.translation
        let scale = transform.scale
        let rotation = transform.rotation
        let x = CGFloat(translation.x)
        let y = CGFloat(translation.y - (childSpatialized2DElement.scrollEnabled ? 0 : parentYOffset))
        let z = CGFloat(translation.z) + (childSpatialized2DElement.zIndex * zOrderBias)
        let width = CGFloat(child.width)
        let height = CGFloat(child.height)
        let anchor = child.rotationAnchor

        // Matrix = MTranslate X MRotate X MScale
        return Spatialized2DView().environment(childSpatialized2DElement)
            .frame(width: width, height: height)
            // use .offset(smallVal) to workaround for glassEffect not working and small width/height spatialDiv not working
            .offset(z: 0.0001)
            .scaleEffect(
                x: CGFloat(scale.x),
                y: CGFloat(scale.y),
                z: CGFloat(scale.z),
                anchor: anchor
            )
            .rotation3DEffect(
                Rotation3D(rotation),
                anchor: anchor
            )
            .position(x: x, y: y)
            .offset(z: z)
            .gesture(dragGesture)
    }
}

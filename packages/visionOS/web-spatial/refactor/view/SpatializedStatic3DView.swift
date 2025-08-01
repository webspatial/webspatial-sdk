import RealityKit
import SwiftUI

class SpatializedStatic3DViewGestureData {
    var dragStarted = false
    var dragStart = 0.0
    var dragVelocity = 0.0
}

struct SpatializedStatic3DView: View {
    @Environment(SpatializedElement.self) var spatializedElement: SpatializedElement

    @State private var gestureData = SpatializedStatic3DViewGestureData()

    private var spatializedStatic3DElement: SpatializedStatic3DElement {
        return spatializedElement as! SpatializedStatic3DElement
    }

    @ViewBuilder
    var body: some View {
        if let url = URL(string: spatializedStatic3DElement.modelURL) {
            Model3D(url: url) { phase in
                switch phase {
                case let .success(model):
                    model.gesture(dragGesture)
                case let .failure(error):
                    Text("Failed to load: \(error.localizedDescription)")
                default:
                    ProgressView()
                }
            }
        } else {
            Text("Invalid Model")
        }
    }

    private var dragGesture: some Gesture {
        DragGesture()
    }
}

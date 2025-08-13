import RealityKit
import SwiftUI

class SpatializedStatic3DViewGestureData {
    var dragStarted = false
    var dragStart = 0.0
    var dragVelocity = 0.0
}

struct TapEvent: Encodable {
    let location3D: Point3D
}

struct SpatializedStatic3DView: View {
    @Environment(SpatializedElement.self) var spatializedElement: SpatializedElement
    @Environment(SpatialScene.self) var spatialScene: SpatialScene

    @State private var gestureData = SpatializedStatic3DViewGestureData()
    
    // Begin Interaction
    var tapGesture: some Gesture {
        SpatialTapGesture(count: 1)
            .onEnded(onTapEnded)
    }
    
    private func onTapEnded(_ event: SpatialTapGesture.Value) {
        print("onTapEnded \(event.location3D)")
        
        spatialScene.sendWebMsg(spatializedElement.id, TapEvent(location3D: event.location3D))
    }

    
    // End Interaction 


    private var spatializedStatic3DElement: SpatializedStatic3DElement {
        return spatializedElement as! SpatializedStatic3DElement
    }

    @ViewBuilder
    var body: some View {
        if let url = URL(string: spatializedStatic3DElement.modelURL) {
            let enableTapEvent = spatializedStatic3DElement.enableTapEvent

            Model3D(url: url) { newPhase in
                switch newPhase {
                case .empty:
                    ProgressView()

                case let .success(resolvedModel3D):
                    resolvedModel3D
                        .resizable(true)
                        .aspectRatio(
                            nil,
                            contentMode: .fit
                        )
                        .gesture(enableTapEvent ? tapGesture : nil)
                        .onAppear {
//                            self.onLoadSuccess()
                        }

                case .failure:
                    //                            use UIView.onAppear to notify error phase.
                    Text("").onAppear {
//                        self.onLoadFailure(error.localizedDescription)
                    }

                @unknown default:
                    EmptyView()
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

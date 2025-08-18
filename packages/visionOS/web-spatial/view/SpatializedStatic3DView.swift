import RealityKit
import SwiftUI

struct SpatializedStatic3DView: View {
    @Environment(SpatializedElement.self) var spatializedElement: SpatializedElement
    @Environment(SpatialScene.self) var spatialScene: SpatialScene

    private var spatializedStatic3DElement: SpatializedStatic3DElement {
        return spatializedElement as! SpatializedStatic3DElement
    }

    @ViewBuilder
    var body: some View {
        let enableGesture = spatializedElement.enableGesture
        if let url = URL(string: spatializedStatic3DElement.modelURL) {
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
                        .onAppear {
//                            self.onLoadSuccess()
                        }
                        .if(enableGesture) { view in view.hoverEffect()}
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
}

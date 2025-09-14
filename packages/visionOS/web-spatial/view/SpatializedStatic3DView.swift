import RealityKit
import SwiftUI

struct SpatializedStatic3DView: View {
    @Environment(SpatializedElement.self) var spatializedElement: SpatializedElement
    @Environment(SpatialScene.self) var spatialScene: SpatialScene

    private var spatializedStatic3DElement: SpatializedStatic3DElement {
        return spatializedElement as! SpatializedStatic3DElement
    }
    
    func onLoadSuccess() {
        spatialScene.sendWebMsg(spatializedElement.id, ModelLoadSuccess())
    }

    func onLoadFailure() {
        spatialScene.sendWebMsg(spatializedElement.id, ModelLoadFailure())
    }

    @ViewBuilder
    var body: some View {
        let transform = spatializedStatic3DElement.modelTransform
        let translation = transform.translation
        let scale = transform.scale
        let rotation = transform.rotation!
        let x = translation.x
        let y = translation.y
        let z = translation.z
        
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
                            self.onLoadSuccess()
                        }
                        .if(enableGesture) { view in view.hoverEffect()}
                case .failure:
                    Text("").onAppear {
                        self.onLoadFailure()
                    }
                @unknown default:
                    EmptyView()
                }
            }
            .scaleEffect(
                x: scale.width,
                y: scale.height,
                z: scale.depth
            )
            .rotation3DEffect(
                rotation
            )
            .offset(x: x, y: y)
            .offset(z: z)
        } else {
            EmptyView()
        }
    }
}

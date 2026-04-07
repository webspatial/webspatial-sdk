import RealityKit
import SwiftUI

struct SpatializedStatic3DView: View {
    @Environment(SpatializedElement.self) var spatializedElement: SpatializedElement
    @Environment(SpatialScene.self) var spatialScene: SpatialScene

    @State private var asset: Model3DAsset?
    @State private var isLoading = false

    private var spatializedStatic3DElement: SpatializedStatic3DElement {
        return spatializedElement as! SpatializedStatic3DElement
    }

    func onLoadSuccess() {
        spatialScene.sendWebMsg(spatializedElement.id, ModelLoadSuccess())
    }

    func onLoadFailure() {
        spatialScene.sendWebMsg(spatializedElement.id, ModelLoadFailure())
    }

    var body: some View {
        let depth = spatializedElement.depth
        let transform = spatializedStatic3DElement.modelTransform
        let translation = transform.translation
        let scale = transform.scale
        let rotation = transform.rotation!
        let x = translation.x
        let y = translation.y
        let z = translation.z

        let enableGesture = spatializedElement.enableGesture
        if let url = localOrRemoteURL(url: spatializedStatic3DElement.modelURL) {
            Group {
                if isLoading {
                    ProgressView()
                } else if let asset {
                    Model3D(asset: asset) { resolvedModel3D in
                        resolvedModel3D
                            .resizable(true)
                            .aspectRatio(
                                nil,
                                contentMode: .fit
                            )
                            .if(!depth.isZero) { view in view.scaledToFit3D() }
                            .onAppear {
                                self.onLoadSuccess()
                            }
                            .if(enableGesture) { view in view.hoverEffect() }
                    }
                } else {
                    Text("").onAppear {
                        self.onLoadFailure()
                    }
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
            .onChange(of: asset?.animationPlaybackController?.isComplete) { _, isComplete in
                guard isComplete == true,
                      spatializedStatic3DElement.loop,
                      let asset,
                      let animation = asset.availableAnimations.first else { return }
                asset.selectedAnimation = animation
                asset.animationPlaybackController?.resume()
            }
            .task(id: url) { await loadSource(from: url) }
        } else {
            EmptyView()
        }
    }

    /// Downloads a remote model file and loads it as a Model3DAsset.
    /// Model3DAsset(url:) requires a local file URL, so remote
    /// resources must be downloaded first.
    private func loadAsset(from url: URL) async throws -> Model3DAsset {
        if url.isFileURL {
            return try await Model3DAsset(url: url)
        }
        let (tempURL, _) = try await URLSession.shared.download(from: url)
        // TODO: Use FileManager.temporaryDirectory and FileManager.removeItem for auto cleanup
        let localURL = tempURL.deletingPathExtension()
            .appendingPathExtension(url.pathExtension)
        try FileManager.default.moveItem(at: tempURL, to: localURL)
        return try await Model3DAsset(url: localURL)
    }

    private func loadSource(from url: URL) async {
        isLoading = true
        do {
            asset = try await loadAsset(from: url)
            if spatializedStatic3DElement.autoplay, let firstAnimation = asset?.availableAnimations.first {
                asset?.selectedAnimation = firstAnimation
            }
        } catch {
            asset = nil
        }
        isLoading = false
    }
}

private func localOrRemoteURL(url: String) -> URL? {
    URL(string: url.hasPrefix("file://") ? pwaManager.getLocalResourceURL(url: url) : url)
}

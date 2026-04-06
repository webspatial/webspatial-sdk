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
        // TODO: send back the currentSrc
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
        let hasValidSource = URL(string: spatializedStatic3DElement.modelURL) != nil || !spatializedStatic3DElement.sources.isEmpty
        if hasValidSource {
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
            .task(id: spatializedStatic3DElement.allSources) { await loadSources() }
        } else {
            EmptyView()
        }
    }

    private func loadSources() async {
        isLoading = true
        asset = await loadSources(spatializedStatic3DElement.allSources)
        if spatializedStatic3DElement.autoplay, let firstAnimation = asset?.availableAnimations.first {
            asset?.selectedAnimation = firstAnimation
        }
        isLoading = false
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

    /// Attempts to load from each source in order, returning the first success.
    private func loadSources(_ sources: [ModelSource]) async -> Model3DAsset? {
        for source in sources {
            guard let url = localOrRemoteURL(url: source.src) else { continue }
            do {
                return try await loadAsset(from: url)
            } catch {
                continue
            }
        }
        return nil
    }
}

private func localOrRemoteURL(url: String) -> URL? {
    URL(string: url.hasPrefix("file://") ? pwaManager.getLocalResourceURL(url: url) : url)
}

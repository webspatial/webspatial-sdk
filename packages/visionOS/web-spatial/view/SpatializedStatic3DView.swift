import RealityKit
import SwiftUI

struct SpatializedStatic3DView: View {
    @Environment(SpatializedElement.self) var spatializedElement: SpatializedElement
    @Environment(SpatialScene.self) var spatialScene: SpatialScene

    @State private var asset: Model3DAsset?
    @State private var loadFailed = false

    private var spatializedStatic3DElement: SpatializedStatic3DElement {
        return spatializedElement as! SpatializedStatic3DElement
    }

    /// Ordered list of sources to attempt, prioritizing USDZ when available.
    private var orderedSources: [ModelSource] {
        let sources = spatializedStatic3DElement.sources
        guard !sources.isEmpty else { return [] }

        let usdzType = "model/vnd.usdz+zip"
        let usdz = sources.filter { $0.type == usdzType }
        let rest = sources.filter { $0.type != usdzType }
        return usdz + rest
    }

    func onLoadSuccess() {
        spatialScene.sendWebMsg(spatializedElement.id, ModelLoadSuccess())
    }

    func onLoadFailure() {
        spatialScene.sendWebMsg(spatializedElement.id, ModelLoadFailure())
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
    private func loadFromSources(_ sources: [ModelSource]) async -> Model3DAsset? {
        for source in sources {
            guard let url = URL(string: source.src) else { continue }
            do {
                return try await loadAsset(from: url)
            } catch {
                continue
            }
        }
        return nil
    }

    /// Task ID that changes when either the primary URL or the sources array changes.
    private var sourceTaskId: String {
        let sourcesKey = spatializedStatic3DElement.sources
            .map { $0.src }
            .joined(separator: "|")
        return "\(spatializedStatic3DElement.modelURL)|\(sourcesKey)"
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
                if let asset {
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
                } else if loadFailed {
                    Text("").onAppear {
                        self.onLoadFailure()
                    }
                } else {
                    ProgressView()
                }
            }
            .onChange(of: asset?.animationPlaybackController?.isComplete) { _, isComplete in
                guard isComplete == true,
                      spatializedStatic3DElement.loop,
                      let asset,
                      let animation = asset.availableAnimations.first else { return }
                asset.selectedAnimation = animation
                asset.animationPlaybackController?.resume()
            }
            .task(id: sourceTaskId) {
                let sources = orderedSources
                if sources.isEmpty {
                    // Fallback: single modelURL with no sources array
                    guard let url = URL(string: spatializedStatic3DElement.modelURL) else { return }
                    do {
                        let loaded = try await loadAsset(from: url)
                        if spatializedStatic3DElement.autoplay,
                           let firstAnimation = loaded.availableAnimations.first
                        {
                            loaded.selectedAnimation = firstAnimation
                        }
                        self.asset = loaded
                        self.loadFailed = false
                    } catch {
                        self.asset = nil
                        self.loadFailed = true
                    }
                } else {
                    // Sequential fallback through sources
                    if let loaded = await loadFromSources(sources) {
                        if spatializedStatic3DElement.autoplay,
                           let firstAnimation = loaded.availableAnimations.first
                        {
                            loaded.selectedAnimation = firstAnimation
                        }
                        self.asset = loaded
                        self.loadFailed = false
                    } else {
                        self.asset = nil
                        self.loadFailed = true
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
        } else {
            EmptyView()
        }
    }
}

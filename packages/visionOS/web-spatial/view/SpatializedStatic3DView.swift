import RealityKit
import SwiftUI

struct SpatializedStatic3DView: View {
    @Environment(SpatializedElement.self) var spatializedElement: SpatializedElement
    @Environment(SpatialScene.self) var spatialScene: SpatialScene

    @State private var asset: Model3DAsset?
    @State private var source: String?
    @State private var isLoading = false

    private var spatializedStatic3DElement: SpatializedStatic3DElement {
        return spatializedElement as! SpatializedStatic3DElement
    }

    func onLoadSuccess(src: String) {
        spatialScene.sendWebMsg(spatializedElement.id, ModelLoadSuccess(src: src))
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
        if !spatializedStatic3DElement.allSources.isEmpty {
            Group {
                if isLoading {
                    ProgressView()
                } else if let asset, let source {
                    Model3D(asset: asset) { resolvedModel3D in
                        resolvedModel3D
                            .resizable(true)
                            .aspectRatio(
                                nil,
                                contentMode: .fit
                            )
                            .if(!depth.isZero) { view in view.scaledToFit3D() }
                            .onAppear {
                                self.onLoadSuccess(src: source)
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
                guard isComplete == true else { return }
                if spatializedStatic3DElement.loop,
                   let asset,
                   let animation = asset.availableAnimations.first
                {
                    asset.selectedAnimation = animation
                    asset.animationPlaybackController?.speed = Float(spatializedStatic3DElement.playbackRate)
                    asset.animationPlaybackController?.resume()
                } else {
                    // Non-looping animation completed naturally; sync paused state to JS
                    spatializedStatic3DElement.animationPaused = true
                }
            }
            .onChange(of: spatializedStatic3DElement.animationPaused) { onPlayback(isPaused: $1) }
            .onChange(of: spatializedStatic3DElement.playbackRate) { asset?.animationPlaybackController?.speed = Float($1) }
            .task(id: spatializedStatic3DElement.allSources) { await loadSources() }
        } else {
            EmptyView()
        }
    }

    /// Plays or pauses the model animation and sends an animation state to the web code
    private func onPlayback(isPaused: Bool) {
        guard let asset else {
            // If entity has not loaded yet and play is called then autoplay after load
            if !isPaused { spatializedStatic3DElement.autoplay = true }
            return
        }
        // Setting selectedAnimation resets the animation and autoplays on first load
        if asset.selectedAnimation == nil || asset.animationPlaybackController?.isComplete == true {
            asset.selectedAnimation = asset.availableAnimations.first
        }
        let controller = asset.animationPlaybackController
        controller?.speed = Float(spatializedStatic3DElement.playbackRate)
        isPaused ? controller?.pause() : controller?.resume()
        let duration = controller?.duration ?? 0
        spatialScene.sendWebMsg(
            spatializedElement.id,
            AnimationStateChangeEvent(
                detail: AnimationStateChangeDetail(paused: isPaused, duration: duration)
            )
        )
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

    private func loadSources() async {
        isLoading = true
        let result = await loadSources(spatializedStatic3DElement.allSources)
        asset = result?.asset
        source = result?.url.absoluteString
        if spatializedStatic3DElement.autoplay {
            // If animationPaused didn't change then SwiftUI will not trigger onChange so manually trigger playback
            // This happens when play is called before load and autoplay is enabled
            if spatializedStatic3DElement.animationPaused {
                spatializedStatic3DElement.animationPaused = false
            } else { onPlayback(isPaused: false) }
        }
        isLoading = false
    }

    /// Attempts to load from each source in order, returning the first success.
    private func loadSources(_ sources: [ModelSource]) async -> (url: URL, asset: Model3DAsset)? {
        for source in sources {
            guard let url = localOrRemoteURL(url: source.src) else { continue }
            do {
                return try (url, await loadAsset(from: url))
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

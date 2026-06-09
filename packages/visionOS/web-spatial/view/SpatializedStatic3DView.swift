import RealityKit
import SwiftUI

/// Radians of rotation applied per point of drag translation. Tuned so a
/// ~360pt swipe produces roughly a full turn.
private let orbitDragSensitivity: Double = .pi / 360

/// Soft pitch limit. The visible pitch tapers towards this via a rubber-band
/// curve so the user can drag past, but the model never approaches upside-down.
private let orbitMaxPitch: Double = .pi / 3

struct SpatializedStatic3DView: View {
    @Environment(SpatializedElement.self) var spatializedElement: SpatializedElement
    @Environment(SpatialScene.self) var spatialScene: SpatialScene

    @State private var loadState: LoadState = .idle
    @State private var orbitState = OrbitState()

    private var spatializedStatic3DElement: SpatializedStatic3DElement {
        return spatializedElement as! SpatializedStatic3DElement
    }

    private var asset: Model3DAsset? {
        if case let .loaded(asset, _) = loadState { return asset }
        return nil
    }

    func onLoadSuccess(src: String) {
        spatialScene.sendWebMsg(spatializedElement.id, ModelLoadSuccess(src: src))
    }

    func onLoadFailure() {
        spatialScene.sendWebMsg(spatializedElement.id, ModelLoadFailure())
    }

    var body: some View {
        let depth = spatializedElement.depth
        let transform = spatializedStatic3DElement.entityTransform
        let translation = transform.translation
        let scale = transform.scale
        let rotation = transform.rotation!
        let x = translation.x
        let y = translation.y
        let z = translation.z

        let isOrbit = spatializedStatic3DElement.stagemode == .orbit
        let enableGesture = spatializedElement.enableGesture
        if spatializedStatic3DElement.loading == .eager {
            Group {
                switch loadState {
                case .idle, .loading:
                    posterView { ProgressView() }
                case let .loaded(asset, _):
                    Model3D(asset: asset) { resolvedModel3D in
                        resolvedModel3D
                            .resizable(true)
                            .aspectRatio(
                                nil,
                                contentMode: .fit
                            )
                            .if(!depth.isZero) { view in view.scaledToFit3D() }
                            .if(enableGesture || isOrbit) { view in view.hoverEffect() }
                    }
                case .failed:
                    posterView {}
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
            .if(isOrbit) { view in view.gesture(orbitDragGesture) }
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
            .onChange(of: spatializedStatic3DElement.playbackRate) {
                asset?.animationPlaybackController?.speed = spatializedStatic3DElement.animationPaused ? 0 : Float($1)
            }
            .onChange(of: spatializedStatic3DElement.pendingSeekTime) { _, time in onSeek(time: time) }
            .task(id: spatializedStatic3DElement.allSources) { await loadSources() }
        } else {
            EmptyView()
        }
    }

    /// Renders the poster image while the 3D model is loading or after all
    /// sources fail. When no poster URL is provided, or the poster itself is
    /// still loading/failed, the supplied `fallback` view is shown instead.
    @ViewBuilder
    private func posterView<Fallback: View>(
        @ViewBuilder fallback: @escaping () -> Fallback
    ) -> some View {
        if let posterURL = spatializedStatic3DElement.posterURL,
           let url = localOrRemoteURL(url: posterURL)
        {
            AsyncImage(url: url) { phase in
                if case let .success(image) = phase {
                    image.resizable().aspectRatio(contentMode: .fit)
                } else {
                    fallback()
                }
            }
        } else {
            fallback()
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
        controller?.speed = isPaused ? 0 : Float(spatializedStatic3DElement.playbackRate)
        if let time = spatializedStatic3DElement.pendingSeekTime, let controller {
            controller.time = time
            spatializedStatic3DElement.pendingSeekTime = nil
        }
        isPaused ? controller?.pause() : controller?.resume()
        sendAnimationStateChange(isPaused: isPaused)
    }

    /// Seeks the underlying animation controller when a non-nil `time` is
    /// requested, then clears `pendingSeekTime` so subsequent identical
    /// requests still trigger a fresh seek.
    private func onSeek(time: Double?) {
        guard let controller = asset?.animationPlaybackController, let time else { return }
        controller.time = time
        spatializedStatic3DElement.pendingSeekTime = nil
        sendAnimationStateChange(isPaused: spatializedStatic3DElement.animationPaused)
    }

    /// Emits the current animation state to the web layer, sampling the
    /// controller's position and the wall clock together so the web side can
    /// extrapolate between samples.
    private func sendAnimationStateChange(isPaused: Bool) {
        let controller = asset?.animationPlaybackController
        let duration = controller?.duration ?? 0
        let currentTime = controller?.time ?? 0
        spatialScene.sendWebMsg(
            spatializedElement.id,
            AnimationStateChangeEvent(
                detail: AnimationStateChangeDetail(
                    paused: isPaused,
                    duration: duration,
                    currentTime: currentTime,
                    timestamp: Date().timeIntervalSince1970 * 1000
                )
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
        loadState = .loading
        let result = await loadSources(spatializedStatic3DElement.allSources)
        guard !Task.isCancelled else { return }
        if let result {
            loadState = .loaded(result.asset, result.url.absoluteString)
            onLoadSuccess(src: result.url.absoluteString)
            // If animationPaused didn't change then SwiftUI will not trigger onChange so manually trigger playback
            // This happens when play is called before load and autoplay is enabled
            if spatializedStatic3DElement.autoplay, spatializedStatic3DElement.animationPaused {
                spatializedStatic3DElement.animationPaused = false
            } else { onPlayback(isPaused: !spatializedStatic3DElement.autoplay) }
        } else {
            loadState = .failed
            onLoadFailure()
        }
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

    // MARK: - Orbit interaction

    /// Horizontal drag yaws around world Y, vertical drag pitches around world
    /// X (with elastic clamping). Yaw accumulates across drags; pitch returns
    /// to neutral on release.
    private var orbitDragGesture: some Gesture {
        DragGesture(minimumDistance: 0)
            .onChanged { value in
                if !orbitState.isDragging {
                    orbitState.captureBase(from: spatializedStatic3DElement.entityTransform)
                }
                let yaw = orbitState.dragStartYaw + Double(value.translation.width) * orbitDragSensitivity
                let rawPitch = -Double(value.translation.height) * orbitDragSensitivity
                orbitState.accumulatedYaw = yaw
                orbitState.currentPitch = elasticClamp(rawPitch, limit: orbitMaxPitch)
                applyOrbit()
            }
            .onEnded { _ in
                orbitState.isDragging = false
                withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                    orbitState.currentPitch = 0
                    applyOrbit()
                }
            }
    }

    private func applyOrbit() {
        let yawRot = AffineTransform3D(
            rotation: Rotation3D(angle: .radians(orbitState.accumulatedYaw), axis: .y)
        )
        let pitchRot = AffineTransform3D(
            rotation: Rotation3D(angle: .radians(orbitState.currentPitch), axis: .x)
        )
        // Apply base → yaw → pitch so the user always rotates around world axes.
        let effective = pitchRot.concatenating(yawRot).concatenating(orbitState.baseTransform)
        spatializedStatic3DElement.entityTransform = effective
        spatialScene.sendWebMsg(
            spatializedElement.id,
            EntityTransformChangeEvent(detail: EntityTransformChangeDetail(transform: effective.columnMajorArray))
        )
    }
}

/// Rubber-band curve mapping the unbounded raw drag pitch into a bounded
/// effective angle. Linear near zero, asymptotic near `limit`, so dragging
/// further yields ever-smaller motion.
private func elasticClamp(_ value: Double, limit: Double) -> Double {
    limit * tanh(value / limit)
}

@Observable
final class OrbitState {
    /// `entityTransform` snapshot from the last gesture start. Subsequent
    /// drags compose yaw/pitch on top of this so the JS-supplied initial pose
    /// is preserved.
    var baseTransform: AffineTransform3D = .identity
    var accumulatedYaw: Double = 0
    var currentPitch: Double = 0
    var dragStartYaw: Double = 0
    var isDragging: Bool = false

    func captureBase(from current: AffineTransform3D) {
        // Strip the previous yaw contribution so the new base is the
        // original JS-supplied pose, not a pose already rotated by yaw.
        let inverseYaw = AffineTransform3D(
            rotation: Rotation3D(angle: .radians(-accumulatedYaw), axis: .y)
        )
        baseTransform = inverseYaw.concatenating(current)
        dragStartYaw = accumulatedYaw
        isDragging = true
    }
}

private extension AffineTransform3D {
    /// Column-major 16-element flattening matching the format JS uses when
    /// sending the matrix into native via
    /// `UpdateSpatializedStatic3DElementProperties`. `AffineTransform3D.matrix`
    /// only stores the upper 3 rows; the implicit `[0, 0, 0, 1]` bottom row
    /// is re-introduced here.
    var columnMajorArray: [Double] {
        let c = matrix.columns
        return [
            c.0.x, c.0.y, c.0.z, 0,
            c.1.x, c.1.y, c.1.z, 0,
            c.2.x, c.2.y, c.2.z, 0,
            c.3.x, c.3.y, c.3.z, 1,
        ]
    }
}

private func localOrRemoteURL(url: String) -> URL? {
    URL(string: url.hasPrefix("file://") ? pwaManager.getLocalResourceURL(url: url) : url)
}

private enum LoadState {
    case idle
    case loading
    case loaded(Model3DAsset, String)
    case failed
}

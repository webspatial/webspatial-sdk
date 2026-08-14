import RealityKit
import SwiftUI

@Observable
class SpatialModelEntity: SpatialEntity {
    private var modelEntity: Entity?
    /// Retained so `UpdateUnlitMaterialProperties` can re-apply current `SpatialMaterial.resource` after native material updates.
    private(set) var overrideSpatialMaterials: [SpatialMaterial] = []

    /// Clip catalog extracted from this instance's own cloned subtree.
    /// Ids match the owning `SpatialModelResource`'s catalog because both are
    /// produced by the same deterministic traversal.
    private var clipInfos: [AnimationClipInfo] = []
    private var clipTargets: [String: (entity: Entity, animation: AnimationResource)] = [:]

    /// At most one built-in clip plays per instance (V1: no blending).
    private var activeController: AnimationPlaybackController?
    private var activeClipId: String?
    private var activeLoop = false
    private var activeRate: Float = 1
    private var stateTimer: Timer?

    /// Scene used to stream `animationstatechange` samples back to JS.
    /// Set by `SpatialScene` when handling animation control commands.
    weak var animationEventScene: SpatialScene?

    required init(_ modelResource: SpatialModelResource, _ _name: String = "") {
        super.init(_name)
        modelEntity = modelResource.resource?.clone(recursive: true)
        if let modelEntity = modelEntity {
            addChild(modelEntity)
            generateCollisionShapes(recursive: true)
            let extracted = SpatialModelResource.extractAnimationClips(from: modelEntity)
            clipInfos = extracted.clips
            clipTargets = extracted.resources
        }
    }

    required init() {
        super.init()
    }

    func setMaterials(_ materials: [SpatialMaterial]) {
        overrideSpatialMaterials = materials
        applyOverrideMaterials()
    }

    /// Re-apply stored override materials using each `SpatialMaterial`'s current `resource` (e.g. after unlit property updates).
    func refreshMaterials() {
        applyOverrideMaterials()
    }

    func usesMaterial(_ materialId: String) -> Bool {
        overrideSpatialMaterials.contains { $0.id == materialId }
    }

    private func applyOverrideMaterials() {
        guard let modelEntity = modelEntity else { return }
        // TODO(P1): Clearing overrides (`setMaterials([])`) assigns an empty material list here; there is
        // no baseline of the model asset’s authored materials to restore. Persist per-component defaults
        // at load (or skip writing when overrides are empty) so clears return to the authored look.
        func applyMaterials(to entity: Entity) {
            if var modelComp = entity.components[ModelComponent.self] {
                modelComp.materials = overrideSpatialMaterials.compactMap { $0.resource }
                entity.components.set(modelComp)
            }
            for child in entity.children {
                applyMaterials(to: child)
            }
        }
        applyMaterials(to: modelEntity)
    }

    // MARK: - Built-in clip animation control

    /// Starts (or resumes) a clip. A different clip immediately replaces the
    /// active one (V1: no crossfade). Passing nil resumes the current clip or
    /// falls back to the first discovered clip.
    func playAnimation(clipId: String?, loop: Bool, rate: Float) {
        let resolvedId = clipId ?? activeClipId ?? clipInfos.first?.id
        guard let id = resolvedId, let target = clipTargets[id] else { return }

        // Same clip, still in flight, same loop mode → resume instead of restarting.
        if id == activeClipId,
           let controller = activeController,
           controller.isValid, !controller.isComplete,
           loop == activeLoop
        {
            activeRate = rate
            controller.speed = rate
            controller.resume()
            startStateSampling()
            emitAnimationState()
            return
        }

        stopActiveAnimation()

        var animation = target.animation
        if loop {
            animation = animation.repeat(duration: .infinity)
        }
        let controller = target.entity.playAnimation(animation)
        controller.speed = rate
        activeController = controller
        activeClipId = id
        activeLoop = loop
        activeRate = rate
        startStateSampling()
        emitAnimationState()
    }

    func pauseAnimation() {
        activeController?.pause()
        stateTimer?.invalidate()
        stateTimer = nil
        emitAnimationState()
    }

    func seekAnimation(to time: TimeInterval) {
        activeController?.time = time
        emitAnimationState()
    }

    func setAnimationPlaybackRate(_ rate: Float) {
        activeRate = rate
        activeController?.speed = rate
        emitAnimationState()
    }

    private func stopActiveAnimation() {
        stateTimer?.invalidate()
        stateTimer = nil
        activeController?.stop()
        activeController = nil
        activeClipId = nil
    }

    /// Samples controller state at 10 Hz while playing — matching the static
    /// `<Model>` implementation — so the JS side can extrapolate in between.
    private func startStateSampling() {
        stateTimer?.invalidate()
        stateTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            self.emitAnimationState()
            // A non-looping clip that reaches its end stays complete; stop
            // sampling after reporting the final (paused) state.
            if let controller = self.activeController, controller.isComplete {
                self.stateTimer?.invalidate()
                self.stateTimer = nil
            }
        }
    }

    private func emitAnimationState() {
        guard let controller = activeController, let scene = animationEventScene else { return }
        let ended = controller.isComplete
        scene.sendWebMsg(
            spatialId,
            AnimationStateChangeEvent(
                detail: AnimationStateChangeDetail(
                    paused: ended ? true : !controller.isPlaying,
                    duration: controller.duration,
                    currentTime: ended ? controller.duration : controller.time,
                    timestamp: Date().timeIntervalSince1970 * 1000,
                    clipId: activeClipId
                )
            )
        )
    }

    override func onDestroy() {
        stopActiveAnimation()
        clipTargets = [:]
        clipInfos = []
        super.onDestroy()
        if let modelEntity = modelEntity {
            removeChild(modelEntity)
        }
        modelEntity = nil
        overrideSpatialMaterials = []
    }

    enum CodingKeys: String, CodingKey {
        case id, name, isDestroyed, children, components, model
    }

    override func encode(to encoder: any Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(spatialId, forKey: .id)
        try container.encode(name, forKey: .name)
        try container.encode(isDestroyed, forKey: .isDestroyed)
        try container.encode(spatialChildren, forKey: .children)
        try container.encode(spatialComponents, forKey: .components)
        try container.encode(modelEntity?.id, forKey: .model)
    }
}

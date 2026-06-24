import Foundation
import QuartzCore

enum SpatializedElementAnimationManagerError: Error {
    case animationNotFound(String)
    case invalidTarget(String)
    case unsupportedStatic3DOpacity
}

final class SpatializedElementAnimationManager: NSObject {
    private var animations: [String: SpatializedElementAnimationObject] = [:]
    private var displayLink: CADisplayLink?
    private let sendWebMsg: ((String, Encodable) -> Void)?

    init(sendWebMsg: ((String, Encodable) -> Void)? = nil) {
        self.sendWebMsg = sendWebMsg
        super.init()
    }

    func getAnimation(_ animationId: String) -> SpatializedElementAnimationObject? {
        animations[animationId]
    }

    var hasActiveFrameDriver: Bool {
        displayLink != nil
    }

    func createAnimation(
        command: CreateSpatializedElementAnimationCommand,
        target: SpatializedElement,
        explicitAnimationId: String? = nil
    ) throws -> SpatializedElementAnimationObject {
        guard let targetKind = SpatializedElementAnimationTargetKind(rawValue: command.targetKind) else {
            throw SpatializedElementAnimationManagerError.invalidTarget("unknown target kind \(command.targetKind)")
        }
        let writeAdapter = SpatializedElementAnimationWriteAdapter.adapter(for: targetKind)
        let sampler = SpatializedElementMotionTimelineSampler(
            timeline: command.timeline,
            baselineTransform: SpatializedElementMotionManager.decomposeTransform(from: writeAdapter.currentAffineTransform(for: target)),
            baselineOpacity: writeAdapter.baselineOpacity(for: target)
        )

        if targetKind == .static3d, sampler.animatesOpacity {
            throw SpatializedElementAnimationManagerError.unsupportedStatic3DOpacity
        }

        let animation = SpatializedElementAnimationObject(
            id: explicitAnimationId,
            targetElement: target,
            targetKind: targetKind,
            timelineSampler: sampler,
            duration: command.timeline.duration,
            timingFunction: "linear",
            delay: command.timeline.delay ?? 0,
            speed: command.timeline.playbackRate ?? 1.0,
            loopConfig: command.timeline.loop ?? .none,
            sendWebMsg: sendWebMsg
        )
        register(animation)
        return animation
    }

    func createLegacyAnimation(
        command: AnimateSpatializedElementMotionCommand,
        target: SpatializedElement
    ) throws -> SpatializedElementAnimationObject {
        let timeline = command.timeline
        guard let timeline else {
            throw SpatializedElementAnimationManagerError.invalidTarget("missing timeline")
        }
        let legacyCommand = CreateSpatializedElementAnimationCommand(
            elementId: target.spatialId,
            targetKind: command.targetKind,
            timeline: timeline
        )
        return try createAnimation(command: legacyCommand, target: target, explicitAnimationId: command.animationId)
    }

    func controlAnimation(_ command: ControlSpatializedElementAnimationCommand) throws {
        guard let animation = animations[command.animationId] else {
            throw SpatializedElementAnimationManagerError.animationNotFound(command.animationId)
        }

        let timestamp = CACurrentMediaTime()
        switch command.type {
        case "play":
            animation.play(at: timestamp)
        case "pause":
            animation.pause(at: timestamp)
        case "resume":
            animation.resume(at: timestamp)
        case "stop":
            animation.stop(at: timestamp)
        case "reset":
            animation.reset(at: timestamp)
        case "finish":
            animation.finish(at: timestamp)
        case "destroy":
            animation.destroy()
        default:
            throw SpatializedElementAnimationManagerError.invalidTarget("unknown control type \(command.type)")
        }

        refreshDisplayLink()
    }

    func controlLegacyAnimation(_ command: AnimateSpatializedElementMotionCommand) throws {
        throw SpatializedElementAnimationManagerError.invalidTarget("\(AnimateSpatializedElementMotionCommand.commandType) is no longer supported; use \(CreateSpatializedElementAnimationCommand.commandType) and \(ControlSpatializedElementAnimationCommand.commandType)")
    }

    func destroyAnimation(_ animationId: String) {
        animations[animationId]?.destroy()
        refreshDisplayLink()
    }

    func destroyAnimationsForElement(_ elementId: String) {
        let ids = animations.values.filter { $0.targetElementId == elementId }.map { $0.uuid }
        for id in ids {
            animations[id]?.destroy()
        }
        refreshDisplayLink()
    }

    func removeAll() {
        let current = Array(animations.values)
        for animation in current {
            animation.destroy()
        }
        animations.removeAll()
        stopDisplayLink()
    }

    func tickAll(timestamp: CFTimeInterval) {
        for animation in animations.values {
            animation.tick(at: timestamp)
        }
        refreshDisplayLink()
    }

    private func register(_ animation: SpatializedElementAnimationObject) {
        var animation = animation
        animations[animation.uuid] = animation
        animation.on(event: SpatialObject.Events.BeforeDestroyed.rawValue) { [weak self] object, _ in
            guard let self = self, let animation = object as? SpatializedElementAnimationObject else { return }
            self.animations.removeValue(forKey: animation.uuid)
            self.refreshDisplayLink()
        }
        refreshDisplayLink()
    }

    private func refreshDisplayLink() {
        if animations.values.contains(where: { $0.isAnimating }) {
            ensureDisplayLinkRunning()
        } else {
            stopDisplayLink()
        }
    }

    private func ensureDisplayLinkRunning() {
        guard displayLink == nil else { return }
        let link = CADisplayLink(target: self, selector: #selector(onFrame(_:)))
        link.preferredFrameRateRange = CAFrameRateRange(minimum: 60, maximum: 90, preferred: 90)
        link.add(to: .main, forMode: .common)
        displayLink = link
    }

    private func stopDisplayLink() {
        displayLink?.invalidate()
        displayLink = nil
    }

    @objc private func onFrame(_ link: CADisplayLink) {
        tickAll(timestamp: CACurrentMediaTime())
    }
}

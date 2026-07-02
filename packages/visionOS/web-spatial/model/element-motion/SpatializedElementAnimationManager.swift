import Foundation
import QuartzCore
import simd
import Spatial

enum SpatializedElementAnimationManagerError: Error {
    case animationNotFound(String)
    case invalidTarget(String)
    case invalidTimeline(String)
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
        try Self.validateTimeline(command.timeline)
        let targetKind = try Self.resolveTargetKind(for: target)
        let writeAdapter = SpatializedElementAnimationWriteAdapter()
        let sampler = SpatializedElementMotionTimelineSampler(
            timeline: command.timeline,
            baselineTransform: Self.decomposeTransform(from: writeAdapter.currentAffineTransform(for: target)),
            baselineOpacity: writeAdapter.baselineOpacity(for: target)
        )

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

    /// Validates native timeline fields that affect frame-driver lifetime.
    private static func validateTimeline(_ timeline: SpatializedMotionTimelinePayload) throws {
        if let playbackRate = timeline.playbackRate,
           !playbackRate.isFinite || playbackRate <= 0
        {
            throw SpatializedElementAnimationManagerError.invalidTimeline("playbackRate must be > 0 and finite")
        }
    }

    /// Resolves the native animation target kind from the concrete element subtype.
    private static func resolveTargetKind(for target: SpatializedElement) throws -> SpatializedElementAnimationTargetKind {
        if target is SpatializedStatic3DElement {
            return .static3d
        }
        if target is SpatializedDynamic3DElement {
            return .dynamic3d
        }
        if target is Spatialized2DElement {
            return .spatialized2d
        }
        throw SpatializedElementAnimationManagerError.invalidTarget("unsupported element type \(String(describing: type(of: target)))")
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
        let current = Array(animations.values)
        for animation in current {
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

    static func decomposeTransform(from transform: AffineTransform3D) -> SpatializedMotionTransformComponents {
        if transform == .identity {
            return .identity
        }

        let m = transform.matrix
        let tx = m.columns.3.x
        let ty = m.columns.3.y
        let tz = m.columns.3.z

        let col0 = SIMD3<Double>(m.columns.0.x, m.columns.0.y, m.columns.0.z)
        let col1 = SIMD3<Double>(m.columns.1.x, m.columns.1.y, m.columns.1.z)
        let col2 = SIMD3<Double>(m.columns.2.x, m.columns.2.y, m.columns.2.z)

        let sx = simd_length(col0)
        let sy = simd_length(col1)
        let sz = simd_length(col2)

        guard sx > 1e-10, sy > 1e-10, sz > 1e-10 else {
            return SpatializedMotionTransformComponents(
                translateX: tx, translateY: ty, translateZ: tz,
                rotateX: 0, rotateY: 0, rotateZ: 0,
                scaleX: sx, scaleY: sy, scaleZ: sz
            )
        }

        let r00 = col0.x / sx; let r10 = col0.y / sx; let r20 = col0.z / sx
        let r01 = col1.x / sy; let r11 = col1.y / sy; let r21 = col1.z / sy
        let r02 = col2.x / sz; let r12 = col2.y / sz; let r22 = col2.z / sz

        let rotY = asin(max(-1, min(1, r02)))
        let rotX: Double
        let rotZ: Double

        if cos(rotY) > 1e-6 {
            rotX = atan2(-r12, r22)
            rotZ = atan2(-r01, r00)
        } else {
            rotX = atan2(r21, r11)
            rotZ = 0
        }

        let rad2deg = 180.0 / Double.pi
        return SpatializedMotionTransformComponents(
            translateX: tx, translateY: ty, translateZ: tz,
            rotateX: rotX * rad2deg,
            rotateY: rotY * rad2deg,
            rotateZ: rotZ * rad2deg,
            scaleX: sx, scaleY: sy, scaleZ: sz
        )
    }

    static func composeTransform(_ transform: SpatializedMotionTransformComponents) -> AffineTransform3D {
        let deg2rad = Double.pi / 180.0

        let cosX = cos(transform.rotateX * deg2rad)
        let sinX = sin(transform.rotateX * deg2rad)
        let cosY = cos(transform.rotateY * deg2rad)
        let sinY = sin(transform.rotateY * deg2rad)
        let cosZ = cos(transform.rotateZ * deg2rad)
        let sinZ = sin(transform.rotateZ * deg2rad)

        let r00 = cosY * cosZ
        let r01 = sinX * sinY * cosZ - cosX * sinZ
        let r02 = cosX * sinY * cosZ + sinX * sinZ
        let r10 = cosY * sinZ
        let r11 = sinX * sinY * sinZ + cosX * cosZ
        let r12 = cosX * sinY * sinZ - sinX * cosZ
        let r20 = -sinY
        let r21 = sinX * cosY
        let r22 = cosX * cosY

        let col0 = simd_double4(r00 * transform.scaleX, r10 * transform.scaleX, r20 * transform.scaleX, 0)
        let col1 = simd_double4(r01 * transform.scaleY, r11 * transform.scaleY, r21 * transform.scaleY, 0)
        let col2 = simd_double4(r02 * transform.scaleZ, r12 * transform.scaleZ, r22 * transform.scaleZ, 0)
        let col3 = simd_double4(transform.translateX, transform.translateY, transform.translateZ, 1)

        return AffineTransform3D(truncating: simd_double4x4(columns: (col0, col1, col2, col3)))
    }
}

import Spatial
@testable import WebSpatial
import XCTest

final class SpatializedElementMotionSessionTests: XCTestCase {
    private func makeSession(
        duration: Double = 2,
        delay: Double = 0
    ) -> SpatializedElementMotionSession {
        let timeline = SpatializedMotionTimelinePayload(
            duration: duration,
            delay: delay,
            playbackRate: nil,
            loop: nil,
            tracks: [
                SpatializedMotionTrackPayload(
                    property: "opacity",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 0, value: 1, timingFunction: "linear"),
                        SpatializedMotionKeyframePayload(at: duration, value: 0.2, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
            ]
        )
        let sampler = SpatializedElementMotionTimelineSampler(
            timeline: timeline,
            baselineTransform: .identity,
            baselineOpacity: 1
        )
        return SpatializedElementMotionSession(
            animationId: "anim-1",
            elementId: "element-1",
            timelineSampler: sampler,
            duration: duration,
            timingFunction: "linear",
            delay: delay
        )
    }

    func test_pausedProgressRemainsFrozenUntilResume() {
        let session = makeSession()
        session.delayCompleted = true
        session.startTime = 10

        XCTAssertEqual(session.currentProgress(at: 11), 0.5, accuracy: 0.0001)

        session.markPaused(at: 11)

        XCTAssertEqual(session.currentProgress(at: 12.5), 0.5, accuracy: 0.0001)
        XCTAssertEqual(session.rawProgress(at: 12.5), 0.5, accuracy: 0.0001)

        session.markResumed(at: 13)

        XCTAssertEqual(session.currentProgress(at: 13), 0.5, accuracy: 0.0001)
        XCTAssertEqual(session.currentProgress(at: 13.5), 0.75, accuracy: 0.0001)
    }

    func test_createAnimationReturnsNativeUuidAndRegistersObject() throws {
        let element = Spatialized2DElement()
        let manager = SpatializedElementAnimationManager()
        let timeline = SpatializedMotionTimelinePayload(
            duration: 2,
            delay: nil,
            playbackRate: nil,
            loop: nil,
            tracks: [
                SpatializedMotionTrackPayload(
                    property: "opacity",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 0, value: 1, timingFunction: "linear"),
                        SpatializedMotionKeyframePayload(at: 2, value: 0.2, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
            ]
        )

        let animation = try manager.createAnimation(
            command: CreateSpatializedElementAnimationCommand(
                elementId: element.id,
                targetKind: "spatialized2d",
                timeline: timeline
            ),
            target: element
        )

        XCTAssertFalse(animation.uuid.isEmpty)
        XCTAssertNotEqual(animation.uuid, element.id)
        XCTAssertTrue(manager.getAnimation(animation.uuid) === animation)
    }

    func test_controlCommandsReuseSameAnimationObjectAndUpdatePlayState() throws {
        let element = Spatialized2DElement()
        let manager = SpatializedElementAnimationManager()
        let timeline = SpatializedMotionTimelinePayload(
            duration: 2,
            delay: nil,
            playbackRate: nil,
            loop: nil,
            tracks: [
                SpatializedMotionTrackPayload(
                    property: "opacity",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 0, value: 1, timingFunction: "linear"),
                        SpatializedMotionKeyframePayload(at: 2, value: 0.2, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
            ]
        )

        let animation = try manager.createAnimation(
            command: CreateSpatializedElementAnimationCommand(
                elementId: element.id,
                targetKind: "spatialized2d",
                timeline: timeline
            ),
            target: element
        )

        let created = animation
        try manager.controlAnimation(ControlSpatializedElementAnimationCommand(animationId: animation.uuid, type: "play"))
        XCTAssertEqual(created.playState, .running)
        XCTAssertTrue(created.isAnimating)

        try manager.controlAnimation(ControlSpatializedElementAnimationCommand(animationId: animation.uuid, type: "pause"))
        XCTAssertEqual(created.playState, .paused)
        XCTAssertTrue(created.isPaused)
        XCTAssertEqual(element.animatingMask.opacityAnimationId, created.uuid)

        try manager.controlAnimation(ControlSpatializedElementAnimationCommand(animationId: animation.uuid, type: "resume"))
        XCTAssertEqual(created.playState, .running)

        try manager.controlAnimation(ControlSpatializedElementAnimationCommand(animationId: animation.uuid, type: "stop"))
        XCTAssertEqual(created.playState, .idle)
        XCTAssertNil(element.animatingMask.opacityAnimationId)
        XCTAssertTrue(manager.getAnimation(animation.uuid) === created)

        try manager.controlAnimation(ControlSpatializedElementAnimationCommand(animationId: animation.uuid, type: "reset"))
        XCTAssertEqual(created.playState, .idle)
        XCTAssertTrue(manager.getAnimation(animation.uuid) === created)

        try manager.controlAnimation(ControlSpatializedElementAnimationCommand(animationId: animation.uuid, type: "finish"))
        XCTAssertEqual(created.playState, .finished)
        XCTAssertTrue(created.finished)
        XCTAssertTrue(manager.getAnimation(animation.uuid) === created)
    }

    func test_pauseKeepsMaskAndFreezesCurrentValues() throws {
        let element = Spatialized2DElement()
        let manager = SpatializedElementAnimationManager()
        let timeline = SpatializedMotionTimelinePayload(
            duration: 2,
            delay: nil,
            playbackRate: nil,
            loop: nil,
            tracks: [
                SpatializedMotionTrackPayload(
                    property: "transform.translate.x",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 0, value: 0, timingFunction: "linear"),
                        SpatializedMotionKeyframePayload(at: 2, value: 10, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
                SpatializedMotionTrackPayload(
                    property: "opacity",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 0, value: 1, timingFunction: "linear"),
                        SpatializedMotionKeyframePayload(at: 2, value: 0.25, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
            ]
        )

        let animation = try manager.createAnimation(
            command: CreateSpatializedElementAnimationCommand(
                elementId: element.id,
                targetKind: "spatialized2d",
                timeline: timeline
            ),
            target: element
        )

        animation.play(at: 0)
        animation.tick(at: 1)
        let frozenTransformX = element.transform.matrix.columns.3.x
        let frozenOpacity = element.opacity

        animation.pause(at: 1.1)
        animation.tick(at: 1.6)

        XCTAssertEqual(element.animatingMask.transformAnimationId, animation.uuid)
        XCTAssertEqual(element.animatingMask.opacityAnimationId, animation.uuid)
        XCTAssertEqual(element.transform.matrix.columns.3.x, frozenTransformX, accuracy: 0.0001)
        XCTAssertEqual(element.opacity, frozenOpacity, accuracy: 0.0001)
    }

    func test_stopResetAndFinishReleaseMask() throws {
        let element = Spatialized2DElement()
        let manager = SpatializedElementAnimationManager()
        let timeline = SpatializedMotionTimelinePayload(
            duration: 2,
            delay: nil,
            playbackRate: nil,
            loop: nil,
            tracks: [
                SpatializedMotionTrackPayload(
                    property: "transform.translate.x",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 0, value: 0, timingFunction: "linear"),
                        SpatializedMotionKeyframePayload(at: 2, value: 10, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
            ]
        )

        let animation = try manager.createAnimation(
            command: CreateSpatializedElementAnimationCommand(
                elementId: element.id,
                targetKind: "spatialized2d",
                timeline: timeline
            ),
            target: element
        )

        animation.play(at: 0)
        XCTAssertEqual(element.animatingMask.transformAnimationId, animation.uuid)

        animation.stop(at: 0.5)
        XCTAssertNil(element.animatingMask.transformAnimationId)
        XCTAssertEqual(animation.playState, .idle)
        XCTAssertFalse(animation.finished)

        animation.play(at: 1)
        XCTAssertEqual(element.animatingMask.transformAnimationId, animation.uuid)

        animation.reset(at: 1.5)
        XCTAssertNil(element.animatingMask.transformAnimationId)
        XCTAssertEqual(animation.playState, .idle)
        XCTAssertFalse(animation.finished)

        animation.play(at: 2)
        XCTAssertEqual(element.animatingMask.transformAnimationId, animation.uuid)

        animation.finish(at: 2.5)
        XCTAssertNil(element.animatingMask.transformAnimationId)
        XCTAssertEqual(animation.playState, .finished)
        XCTAssertTrue(animation.finished)
    }

    func test_destroyAnimationsForElementDestroysRelatedAnimation() throws {
        let element = Spatialized2DElement()
        let manager = SpatializedElementAnimationManager()
        let timeline = SpatializedMotionTimelinePayload(
            duration: 1,
            delay: nil,
            playbackRate: nil,
            loop: nil,
            tracks: [
                SpatializedMotionTrackPayload(
                    property: "transform.translate.x",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 0, value: 0, timingFunction: "linear"),
                        SpatializedMotionKeyframePayload(at: 1, value: 10, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
            ]
        )

        let animation = try manager.createAnimation(
            command: CreateSpatializedElementAnimationCommand(
                elementId: element.id,
                targetKind: "spatialized2d",
                timeline: timeline
            ),
            target: element
        )

        animation.play()
        XCTAssertEqual(element.animatingMask.transformAnimationId, animation.uuid)

        manager.destroyAnimationsForElement(element.id)
        XCTAssertNil(manager.getAnimation(animation.uuid))
        XCTAssertNil(element.animatingMask.transformAnimationId)
        XCTAssertTrue(animation.isDestroyed)
    }

    func test_static3DAnimationWritesOnlyModelTransform() throws {
        let element = SpatializedStatic3DElement()
        let manager = SpatializedElementAnimationManager()
        let timeline = SpatializedMotionTimelinePayload(
            duration: 2,
            delay: nil,
            playbackRate: nil,
            loop: nil,
            tracks: [
                SpatializedMotionTrackPayload(
                    property: "transform.translate.x",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 0, value: 0, timingFunction: "linear"),
                        SpatializedMotionKeyframePayload(at: 2, value: 12, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
            ]
        )

        let animation = try manager.createAnimation(
            command: CreateSpatializedElementAnimationCommand(
                elementId: element.id,
                targetKind: "static3d",
                timeline: timeline
            ),
            target: element
        )

        animation.play(at: 0)
        animation.tick(at: 1)

        XCTAssertEqual(element.modelTransform.matrix.columns.3.x, 6, accuracy: 0.5)
        XCTAssertEqual(element.transform.matrix.columns.3.x, 0, accuracy: 0.0001)
        XCTAssertEqual(element.opacity, 1.0)
    }

    func test_activeAnimationMaskBlocksRegularWritesFromOverridingCurrentValue() throws {
        let element = Spatialized2DElement()
        let manager = SpatializedElementAnimationManager()
        let timeline = SpatializedMotionTimelinePayload(
            duration: 2,
            delay: nil,
            playbackRate: nil,
            loop: nil,
            tracks: [
                SpatializedMotionTrackPayload(
                    property: "transform.translate.x",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 0, value: 0, timingFunction: "linear"),
                        SpatializedMotionKeyframePayload(at: 2, value: 12, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
                SpatializedMotionTrackPayload(
                    property: "opacity",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 0, value: 1, timingFunction: "linear"),
                        SpatializedMotionKeyframePayload(at: 2, value: 0.25, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
            ]
        )

        let animation = try manager.createAnimation(
            command: CreateSpatializedElementAnimationCommand(
                elementId: element.id,
                targetKind: "spatialized2d",
                timeline: timeline
            ),
            target: element
        )

        animation.play(at: 0)
        animation.tick(at: 1)
        let animatedTransformX = element.transform.matrix.columns.3.x
        let animatedOpacity = element.opacity

        XCTAssertFalse(animation.writeAdapter.shouldAllowTransformWrite(on: element, animationId: "other-animation"))
        XCTAssertFalse(animation.writeAdapter.shouldAllowOpacityWrite(on: element, animationId: "other-animation"))

        if !element.animatingMask.locksOpacity {
            element.opacity = 0.9
        }
        if !element.animatingMask.locksTransform {
            element.transform = .init(translation: Vector3D(x: 99, y: 0, z: 0))
        }

        XCTAssertEqual(element.transform.matrix.columns.3.x, animatedTransformX, accuracy: 0.0001)
        XCTAssertEqual(element.opacity, animatedOpacity, accuracy: 0.0001)

        animation.stop(at: 1.2)
        XCTAssertTrue(animation.writeAdapter.shouldAllowTransformWrite(on: element, animationId: "other-animation"))
        XCTAssertTrue(animation.writeAdapter.shouldAllowOpacityWrite(on: element, animationId: "other-animation"))
        if !element.animatingMask.locksOpacity {
            element.opacity = 0.9
        }
        if !element.animatingMask.locksTransform {
            element.transform = .init(translation: Vector3D(x: 99, y: 0, z: 0))
        }

        XCTAssertEqual(element.transform.matrix.columns.3.x, 99, accuracy: 0.0001)
        XCTAssertEqual(element.opacity, 0.9, accuracy: 0.0001)
    }

    func test_static3DOpacityTracksAreRejectedBeforeCreate() {
        let element = SpatializedStatic3DElement()
        let manager = SpatializedElementAnimationManager()
        let timeline = SpatializedMotionTimelinePayload(
            duration: 1,
            delay: nil,
            playbackRate: nil,
            loop: nil,
            tracks: [
                SpatializedMotionTrackPayload(
                    property: "opacity",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 0, value: 1, timingFunction: "linear"),
                        SpatializedMotionKeyframePayload(at: 1, value: 0.2, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
            ]
        )

        XCTAssertThrowsError(
            try manager.createAnimation(
                command: CreateSpatializedElementAnimationCommand(
                    elementId: element.id,
                    targetKind: "static3d",
                    timeline: timeline
                ),
                target: element
            )
        )
    }

    func test_animationStateChangedEmitsMatchingAnimationId() throws {
        let element = Spatialized2DElement()
        var events: [SpatialAnimationStateChanged] = []
        let manager = SpatializedElementAnimationManager(sendWebMsg: { _, msg in
            if let event = msg as? SpatialAnimationStateChanged {
                events.append(event)
            }
        })
        let timeline = SpatializedMotionTimelinePayload(
            duration: 1,
            delay: nil,
            playbackRate: nil,
            loop: nil,
            tracks: [
                SpatializedMotionTrackPayload(
                    property: "opacity",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 0, value: 1, timingFunction: "linear"),
                        SpatializedMotionKeyframePayload(at: 1, value: 0.25, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
            ]
        )

        let animation = try manager.createAnimation(
            command: CreateSpatializedElementAnimationCommand(
                elementId: element.id,
                targetKind: "spatialized2d",
                timeline: timeline
            ),
            target: element
        )

        try manager.controlAnimation(ControlSpatializedElementAnimationCommand(animationId: animation.uuid, type: "play"))
        try manager.controlAnimation(ControlSpatializedElementAnimationCommand(animationId: animation.uuid, type: "pause"))

        XCTAssertEqual(events.last?.animationId, animation.uuid)
        XCTAssertEqual(events.last?.action, "pause")
        XCTAssertEqual(events.last?.playState, .paused)
        XCTAssertEqual(events.last?.finished, false)
    }

    func test_animationStateChangedIncludesFinishedForAllTerminalAndControlEvents() throws {
        let element = Spatialized2DElement()
        var events: [SpatialAnimationStateChanged] = []
        let manager = SpatializedElementAnimationManager(sendWebMsg: { _, msg in
            if let event = msg as? SpatialAnimationStateChanged {
                events.append(event)
            }
        })
        let timeline = SpatializedMotionTimelinePayload(
            duration: 1,
            delay: nil,
            playbackRate: nil,
            loop: nil,
            tracks: [
                SpatializedMotionTrackPayload(
                    property: "opacity",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 0, value: 1, timingFunction: "linear"),
                        SpatializedMotionKeyframePayload(at: 1, value: 0.25, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
            ]
        )

        let animation = try manager.createAnimation(
            command: CreateSpatializedElementAnimationCommand(
                elementId: element.id,
                targetKind: "spatialized2d",
                timeline: timeline
            ),
            target: element
        )

        animation.play(at: 0)
        animation.pause(at: 0.25)
        animation.resume(at: 0.5)
        animation.stop(at: 0.75)
        animation.reset(at: 1)
        animation.finish(at: 1.25)
        animation.play(at: 2)
        animation.tick(at: 2)
        animation.tick(at: 3.1)
        animation.destroy()

        let finishedByAction = events.reduce(into: [String: Bool]()) { result, event in
            result[event.action] = event.finished
        }
        XCTAssertEqual(finishedByAction["play"], false)
        XCTAssertEqual(finishedByAction["pause"], false)
        XCTAssertEqual(finishedByAction["resume"], false)
        XCTAssertEqual(finishedByAction["stop"], false)
        XCTAssertEqual(finishedByAction["reset"], false)
        XCTAssertEqual(finishedByAction["finish"], true)
        XCTAssertEqual(finishedByAction["complete"], true)
        XCTAssertEqual(finishedByAction["destroy"], false)
    }

    func test_destroyAnimationDirectPathDestroysObjectReleasesMaskAndStopsFrameDriver() throws {
        let element = Spatialized2DElement()
        var events: [SpatialAnimationStateChanged] = []
        let manager = SpatializedElementAnimationManager(sendWebMsg: { _, msg in
            if let event = msg as? SpatialAnimationStateChanged {
                events.append(event)
            }
        })
        let timeline = SpatializedMotionTimelinePayload(
            duration: 2,
            delay: nil,
            playbackRate: nil,
            loop: nil,
            tracks: [
                SpatializedMotionTrackPayload(
                    property: "transform.translate.x",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 0, value: 0, timingFunction: "linear"),
                        SpatializedMotionKeyframePayload(at: 2, value: 10, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
            ]
        )

        let animation = try manager.createAnimation(
            command: CreateSpatializedElementAnimationCommand(
                elementId: element.id,
                targetKind: "spatialized2d",
                timeline: timeline
            ),
            target: element
        )

        animation.play(at: 0)
        manager.tickAll(timestamp: 1)
        XCTAssertEqual(element.animatingMask.transformAnimationId, animation.uuid)
        XCTAssertTrue(manager.hasActiveFrameDriver)

        manager.destroyAnimation(animation.uuid)

        XCTAssertNil(manager.getAnimation(animation.uuid))
        XCTAssertNil(SpatialObject.get(animation.uuid))
        XCTAssertNil(element.animatingMask.transformAnimationId)
        XCTAssertTrue(animation.isDestroyed)
        XCTAssertFalse(manager.hasActiveFrameDriver)
        XCTAssertEqual(events.last?.action, "destroy")
        XCTAssertEqual(events.last?.finished, false)
    }

    func test_legacyAnimateSpatializedElementMotionCommandIsExplicitlyUnsupported() throws {
        let element = Spatialized2DElement()
        let manager = SpatializedElementAnimationManager()
        let timeline = SpatializedMotionTimelinePayload(
            duration: 1,
            delay: nil,
            playbackRate: nil,
            loop: nil,
            tracks: [
                SpatializedMotionTrackPayload(
                    property: "opacity",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 0, value: 1, timingFunction: "linear"),
                        SpatializedMotionKeyframePayload(at: 1, value: 0.5, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
            ]
        )

        XCTAssertThrowsError(
            try manager.controlLegacyAnimation(AnimateSpatializedElementMotionCommand(
                animationId: "legacy-animation",
                type: "play",
                targetKind: "spatialized2d",
                elementId: element.id,
                timeline: timeline
            ))
        ) { error in
            guard case let SpatializedElementAnimationManagerError.invalidTarget(reason) = error else {
                return XCTFail("Expected invalidTarget for legacy AnimateSpatializedElementMotion")
            }
            XCTAssertTrue(reason.contains("no longer supported"))
        }
    }
}

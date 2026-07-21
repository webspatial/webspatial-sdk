import Spatial
@testable import WebSpatial
import XCTest

final class SpatializedElementAnimationManagerTests: XCTestCase {
    /// Verifies compound rotation, translation, and non-uniform scale survive transform decomposition.
    func test_compoundTransformRoundTripsThroughDecomposition() {
        let source = SpatializedMotionTransformComponents(
            translateX: 12, translateY: -8, translateZ: 24,
            rotateX: 30, rotateY: 40, rotateZ: 15,
            scaleX: 1.25, scaleY: 0.75, scaleZ: 2
        )

        let original = SpatializedElementAnimationManager.composeTransform(source)
        let decomposed = SpatializedElementAnimationManager.decomposeTransform(from: original)
        let roundTrip = SpatializedElementAnimationManager.composeTransform(decomposed)

        for column in 0 ..< 4 {
            for row in 0 ..< 3 {
                XCTAssertEqual(
                    original.matrix[column][row],
                    roundTrip.matrix[column][row],
                    accuracy: 1e-9,
                    "Mismatch at matrix column \(column), row \(row)"
                )
            }
        }
    }

    /// Verifies an odd negative scale keeps the source transform's reflection.
    func test_reflectedTransformRoundTripsThroughDecomposition() {
        let source = SpatializedMotionTransformComponents(
            translateX: 3, translateY: 5, translateZ: -7,
            rotateX: 20, rotateY: -35, rotateZ: 10,
            scaleX: -1.5, scaleY: 0.5, scaleZ: 2
        )

        let original = SpatializedElementAnimationManager.composeTransform(source)
        let decomposed = SpatializedElementAnimationManager.decomposeTransform(from: original)
        let roundTrip = SpatializedElementAnimationManager.composeTransform(decomposed)

        for column in 0 ..< 4 {
            for row in 0 ..< 3 {
                XCTAssertEqual(
                    original.matrix[column][row],
                    roundTrip.matrix[column][row],
                    accuracy: 1e-9,
                    "Mismatch at matrix column \(column), row \(row)"
                )
            }
        }
    }

    /// Verifies both Y-axis gimbal-lock limits preserve the represented transform matrix.
    func test_gimbalLockTransformsRoundTripThroughDecomposition() {
        for rotateY in [-90.0, 90.0] {
            let source = SpatializedMotionTransformComponents(
                translateX: 4, translateY: -2, translateZ: 6,
                rotateX: 20, rotateY: rotateY, rotateZ: -35,
                scaleX: 1, scaleY: 1.5, scaleZ: 0.75
            )

            let original = SpatializedElementAnimationManager.composeTransform(source)
            let decomposed = SpatializedElementAnimationManager.decomposeTransform(from: original)
            let roundTrip = SpatializedElementAnimationManager.composeTransform(decomposed)

            for column in 0 ..< 4 {
                for row in 0 ..< 3 {
                    XCTAssertEqual(
                        original.matrix[column][row],
                        roundTrip.matrix[column][row],
                        accuracy: 1e-9,
                        "Mismatch at Y=\(rotateY), matrix column \(column), row \(row)"
                    )
                }
            }
        }
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
                timeline: timeline
            ),
            target: element
        )

        animation.play(at: 0)
        animation.tick(at: 1)

        animation.pause(at: 1.1)
        let frozenTransformX = element.transform.matrix.columns.3.x
        let frozenOpacity = element.opacity
        animation.tick(at: 1.6)

        XCTAssertEqual(element.animatingMask.transformAnimationId, animation.uuid)
        XCTAssertEqual(element.animatingMask.opacityAnimationId, animation.uuid)
        XCTAssertEqual(frozenTransformX, 5.5, accuracy: 0.0001)
        XCTAssertEqual(frozenOpacity, 0.5875, accuracy: 0.0001)
        XCTAssertEqual(element.transform.matrix.columns.3.x, frozenTransformX, accuracy: 0.0001)
        XCTAssertEqual(element.opacity, frozenOpacity, accuracy: 0.0001)
    }

    func test_playWhileRunningIsNoOp() throws {
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
                timeline: timeline
            ),
            target: element
        )

        animation.play(at: 0)
        animation.tick(at: 1)
        let runningOpacity = element.opacity
        let playEventCountBefore = events.filter { $0.action == "play" }.count

        animation.play(at: 1.1)

        XCTAssertEqual(animation.playState, .running)
        XCTAssertEqual(element.opacity, runningOpacity, accuracy: 0.0001)
        XCTAssertEqual(events.filter { $0.action == "play" }.count, playEventCountBefore)
    }

    func test_playEmitsStartImmediatelyWhenDelayIsZero() throws {
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
                timeline: timeline
            ),
            target: element
        )

        animation.play(at: 0)

        XCTAssertEqual(events.map(\.action), ["play", "start"])
        XCTAssertEqual(events.last?.playState, .running)
        XCTAssertEqual(events.last?.finished, false)
    }

    func test_delayDefersStartEventUntilFirstPlaybackFrame() throws {
        let element = Spatialized2DElement()
        var events: [SpatialAnimationStateChanged] = []
        let manager = SpatializedElementAnimationManager(sendWebMsg: { _, msg in
            if let event = msg as? SpatialAnimationStateChanged {
                events.append(event)
            }
        })
        let timeline = SpatializedMotionTimelinePayload(
            duration: 2,
            delay: 1,
            playbackRate: nil,
            loop: nil,
            tracks: [
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
                timeline: timeline
            ),
            target: element
        )

        animation.play(at: 0)
        XCTAssertEqual(events.map(\.action), ["play"])

        animation.tick(at: 0.5)
        XCTAssertEqual(events.map(\.action), ["play"])

        animation.tick(at: 1)
        XCTAssertEqual(events.map(\.action), ["play", "start"])
        XCTAssertEqual(events.last?.playState, .running)
        XCTAssertEqual(events.last?.finished, false)
    }

    func test_pauseDuringDelayDoesNotDelayActiveProgress() throws {
        let element = Spatialized2DElement()
        var events: [SpatialAnimationStateChanged] = []
        let manager = SpatializedElementAnimationManager(sendWebMsg: { _, msg in
            if let event = msg as? SpatialAnimationStateChanged {
                events.append(event)
            }
        })
        let timeline = SpatializedMotionTimelinePayload(
            duration: 2,
            delay: 1,
            playbackRate: nil,
            loop: nil,
            tracks: [
                SpatializedMotionTrackPayload(
                    property: "transform.translate.x",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 0, value: 0, timingFunction: "linear"),
                        SpatializedMotionKeyframePayload(at: 2, value: 20, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
            ]
        )

        let animation = try manager.createAnimation(
            command: CreateSpatializedElementAnimationCommand(
                elementId: element.id,
                timeline: timeline
            ),
            target: element
        )

        animation.play(at: 0)
        animation.pause(at: 0.4)
        animation.resume(at: 0.8)
        animation.tick(at: 1.41)

        XCTAssertEqual(events.map(\.action), ["play", "pause", "resume", "start"])

        animation.tick(at: 1.91)
        XCTAssertEqual(element.transform.matrix.columns.3.x, 5, accuracy: 0.0001)

        animation.tick(at: 3.42)
        XCTAssertEqual(animation.playState, .finished)
        XCTAssertEqual(element.transform.matrix.columns.3.x, 20, accuracy: 0.0001)
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

    func test_stopIsIdempotentAfterAnimationBecomesIdle() throws {
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
                timeline: timeline
            ),
            target: element
        )

        animation.play(at: 0)
        animation.stop(at: 0.5)
        let stoppedTransformX = element.transform.matrix.columns.3.x

        animation.stop(at: 1.5)

        XCTAssertEqual(animation.playState, .idle)
        XCTAssertEqual(element.transform.matrix.columns.3.x, stoppedTransformX, accuracy: 0.0001)
    }

    func test_opacityKeepsAnimatedTerminalValueOnComplete() throws {
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
                        SpatializedMotionKeyframePayload(at: 1, value: 0.25, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
            ]
        )

        let animation = try manager.createAnimation(
            command: CreateSpatializedElementAnimationCommand(
                elementId: element.id,
                timeline: timeline
            ),
            target: element
        )

        animation.play(at: 0)
        XCTAssertEqual(element.animatingMask.opacityAnimationId, animation.uuid)

        animation.tick(at: 1.1)

        XCTAssertNil(element.animatingMask.opacityAnimationId)
        XCTAssertEqual(element.opacity, 0.25, accuracy: 0.0001)
    }

    func test_completePreservesAnimatedOpacityTerminalValue() throws {
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
                        SpatializedMotionKeyframePayload(at: 1, value: 0.25, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
            ]
        )

        let animation = try manager.createAnimation(
            command: CreateSpatializedElementAnimationCommand(
                elementId: element.id,
                timeline: timeline
            ),
            target: element
        )

        animation.play(at: 0)
        animation.tick(at: 1.1)

        XCTAssertEqual(element.opacity, 0.25, accuracy: 0.0001)
    }

    func test_transformKeepsAnimatedTerminalValueOnComplete() throws {
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
                timeline: timeline
            ),
            target: element
        )

        animation.play(at: 0)
        animation.tick(at: 1.1)

        XCTAssertNil(element.animatingMask.transformAnimationId)
        XCTAssertEqual(element.transform.matrix.columns.3.x, 10, accuracy: 0.0001)
    }

    func test_static3DRootTransformKeepsAnimatedTerminalValueOnComplete() throws {
        let element = SpatializedStatic3DElement()
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
                timeline: timeline
            ),
            target: element
        )

        animation.play(at: 0)
        animation.tick(at: 1.1)

        XCTAssertNil(element.animatingMask.transformAnimationId)
        XCTAssertEqual(element.transform.matrix.columns.3.x, 10, accuracy: 0.0001)
        XCTAssertEqual(element.entityTransform.matrix.columns.3.x, 0, accuracy: 0.0001)
    }

    func test_stopResetFinishAndCompleteDoNotReplayIgnoredWrites() throws {
        let makeTimeline = {
            SpatializedMotionTimelinePayload(
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
        }

        func makeAnimation() throws -> (Spatialized2DElement, SpatializedElementAnimationObject) {
            let element = Spatialized2DElement()
            let manager = SpatializedElementAnimationManager()
            let animation = try manager.createAnimation(
                command: CreateSpatializedElementAnimationCommand(
                    elementId: element.id,
                    timeline: makeTimeline()
                ),
                target: element
            )
            animation.play(at: 0)
            return (element, animation)
        }

        do {
            let (element, animation) = try makeAnimation()
            animation.stop(at: 0.5)
            XCTAssertEqual(element.transform.matrix.columns.3.x, 5, accuracy: 0.0001)
            XCTAssertEqual(element.opacity, 0.625, accuracy: 0.0001)
        }

        do {
            let (element, animation) = try makeAnimation()
            animation.reset(at: 0.5)
            XCTAssertEqual(element.transform.matrix.columns.3.x, 0, accuracy: 0.0001)
            XCTAssertEqual(element.opacity, 1, accuracy: 0.0001)
        }

        do {
            let (element, animation) = try makeAnimation()
            animation.finish(at: 0.5)
            XCTAssertEqual(element.transform.matrix.columns.3.x, 10, accuracy: 0.0001)
            XCTAssertEqual(element.opacity, 0.25, accuracy: 0.0001)
        }

        do {
            let (element, animation) = try makeAnimation()
            animation.tick(at: 1.1)
            XCTAssertEqual(element.transform.matrix.columns.3.x, 10, accuracy: 0.0001)
            XCTAssertEqual(element.opacity, 0.25, accuracy: 0.0001)
        }
    }

    func test_releaseMaskIgnoresMismatchedAnimationOwnerForStatic3DRootTransformAdapter() {
        let element = SpatializedStatic3DElement()
        let adapter = SpatializedElementAnimationWriteAdapter()

        element.animatingMask.acquire(transform: "owner-a")

        adapter.releaseMaskAndApplyPending(on: element, animationId: "owner-b")

        XCTAssertEqual(element.animatingMask.transformAnimationId, "owner-a")
        XCTAssertEqual(element.transform.matrix.columns.3.x, 0, accuracy: 0.0001)
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

    func test_static3DAnimationWritesContainerRootTransformNotEntityTransform() throws {
        let element = SpatializedStatic3DElement()
        let manager = SpatializedElementAnimationManager()
        let timeline = SpatializedMotionTimelinePayload(
            duration: 2,
            delay: nil,
            playbackRate: nil,
            loop: nil,
            tracks: [
                SpatializedMotionTrackPayload(
                    property: "transform.scale.x",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 0, value: 0.75, timingFunction: "linear"),
                        SpatializedMotionKeyframePayload(at: 2, value: 2, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
            ]
        )

        let animation = try manager.createAnimation(
            command: CreateSpatializedElementAnimationCommand(
                elementId: element.id,
                timeline: timeline
            ),
            target: element
        )

        animation.play(at: 0)
        animation.tick(at: 3)

        XCTAssertEqual(element.transform.matrix.columns.0.x, 2, accuracy: 0.0001)
        XCTAssertEqual(element.entityTransform.matrix.columns.0.x, 1, accuracy: 0.0001)
        XCTAssertEqual(element.opacity, 1.0)
    }

    func test_static3DAnimationResetAndReplayUseRootTransformBaseline() throws {
        let element = SpatializedStatic3DElement()
        let manager = SpatializedElementAnimationManager()
        let timeline = SpatializedMotionTimelinePayload(
            duration: 2,
            delay: nil,
            playbackRate: nil,
            loop: nil,
            tracks: [
                SpatializedMotionTrackPayload(
                    property: "transform.scale.x",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 0, value: 0.75, timingFunction: "linear"),
                        SpatializedMotionKeyframePayload(at: 2, value: 2, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
            ]
        )

        let animation = try manager.createAnimation(
            command: CreateSpatializedElementAnimationCommand(
                elementId: element.id,
                timeline: timeline
            ),
            target: element
        )

        animation.play(at: 0)
        animation.tick(at: 3)
        XCTAssertEqual(element.transform.matrix.columns.0.x, 2, accuracy: 0.0001)
        XCTAssertEqual(element.entityTransform.matrix.columns.0.x, 1, accuracy: 0.0001)

        animation.reset(at: 4)
        XCTAssertEqual(element.transform.matrix.columns.0.x, 0.75, accuracy: 0.0001)
        XCTAssertEqual(element.entityTransform.matrix.columns.0.x, 1, accuracy: 0.0001)

        animation.play(at: 5)
        XCTAssertEqual(element.transform.matrix.columns.0.x, 0.75, accuracy: 0.0001)
        animation.tick(at: 8)
        XCTAssertEqual(element.transform.matrix.columns.0.x, 2, accuracy: 0.0001)
        XCTAssertEqual(element.entityTransform.matrix.columns.0.x, 1, accuracy: 0.0001)
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

    func test_static3DOpacityTracksAnimateElementOpacity() throws {
        let element = SpatializedStatic3DElement()
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
                timeline: timeline
            ),
            target: element
        )

        animation.play(at: 0)
        XCTAssertEqual(element.animatingMask.opacityAnimationId, animation.uuid)

        animation.tick(at: 1)

        XCTAssertEqual(element.opacity, 0.6, accuracy: 0.0001)
        XCTAssertEqual(element.entityTransform.matrix.columns.3.x, 0, accuracy: 0.0001)

        animation.finish(at: 1.5)

        XCTAssertNil(element.animatingMask.opacityAnimationId)
        XCTAssertEqual(element.opacity, 0.2, accuracy: 0.0001)
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
        XCTAssertNotNil(events.last?.values)
        XCTAssertNotNil(events.last?.values?.opacity)
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

    func test_tickAllAllowsAnimationRemovalFromStateCallback() throws {
        let firstElement = Spatialized2DElement()
        let secondElement = Spatialized2DElement()
        var manager: SpatializedElementAnimationManager!
        var triggeringAnimationId: String?
        var animationToDestroyId: String?

        manager = SpatializedElementAnimationManager(sendWebMsg: { _, msg in
            guard let event = msg as? SpatialAnimationStateChanged,
                  event.action == "start",
                  event.animationId == triggeringAnimationId,
                  let animationToDestroyId
            else {
                return
            }
            manager.destroyAnimation(animationToDestroyId)
        })

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
                        SpatializedMotionKeyframePayload(at: 2, value: 0, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
            ]
        )

        let firstAnimation = try manager.createAnimation(
            command: CreateSpatializedElementAnimationCommand(
                elementId: firstElement.id,
                timeline: timeline
            ),
            target: firstElement
        )
        let secondAnimation = try manager.createAnimation(
            command: CreateSpatializedElementAnimationCommand(
                elementId: secondElement.id,
                timeline: timeline
            ),
            target: secondElement
        )
        triggeringAnimationId = firstAnimation.uuid
        animationToDestroyId = secondAnimation.uuid

        firstAnimation.play(at: 0)
        secondAnimation.play(at: 0)
        manager.tickAll(timestamp: 1)

        XCTAssertNil(manager.getAnimation(secondAnimation.uuid))
    }

    func test_createAnimationRejectsInvalidPlaybackRate() {
        let invalidRates: [Double] = [0, -1, .infinity]

        for playbackRate in invalidRates {
            let element = Spatialized2DElement()
            let manager = SpatializedElementAnimationManager()
            let timeline = SpatializedMotionTimelinePayload(
                duration: 1,
                delay: nil,
                playbackRate: playbackRate,
                loop: nil,
                tracks: [
                    SpatializedMotionTrackPayload(
                        property: "opacity",
                        keyframes: [
                            SpatializedMotionKeyframePayload(at: 0, value: 1, timingFunction: "linear"),
                            SpatializedMotionKeyframePayload(at: 1, value: 0, timingFunction: nil),
                        ],
                        timingFunction: "linear"
                    ),
                ]
            )

            XCTAssertThrowsError(try manager.createAnimation(
                command: CreateSpatializedElementAnimationCommand(
                    elementId: element.id,
                    timeline: timeline
                ),
                target: element
            ))
        }
    }

    func test_playDoesNotStealActiveAnimationMask() throws {
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
        let firstAnimation = try manager.createAnimation(
            command: CreateSpatializedElementAnimationCommand(
                elementId: element.id,
                timeline: timeline
            ),
            target: element
        )
        let secondAnimation = try manager.createAnimation(
            command: CreateSpatializedElementAnimationCommand(
                elementId: element.id,
                timeline: timeline
            ),
            target: element
        )

        firstAnimation.play(at: 0)
        secondAnimation.play(at: 0)

        XCTAssertEqual(element.animatingMask.transformAnimationId, firstAnimation.uuid)
        XCTAssertTrue(firstAnimation.isAnimating)
        XCTAssertFalse(secondAnimation.isAnimating)
        XCTAssertEqual(events.last?.animationId, secondAnimation.uuid)
        XCTAssertNotNil(events.last?.error)
    }
}

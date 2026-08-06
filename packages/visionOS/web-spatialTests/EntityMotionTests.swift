import RealityKit
import simd
@testable import WebSpatial
import XCTest

final class EntityMotionBridgeTypesTests: XCTestCase {
    /// Confirms create uses the target id directly and preserves the canonical timeline.
    func testCreateCommandRoundTripsWithDirectId() throws {
        let json = """
        {
          "id": "entity-1",
          "timeline": {
            "duration": 2,
            "delay": 0.25,
            "playbackRate": 1.5,
            "loop": {"reverse": true},
            "tracks": [{
              "property": "position.x",
              "keyframes": [
                {"at": 0, "value": 0, "timingFunction": "easeIn"},
                {"at": 2, "value": 1}
              ],
              "timingFunction": "linear"
            }]
          }
        }
        """

        let command = try JSONDecoder().decode(
            CreateEntityAnimationCommand.self,
            from: Data(json.utf8)
        )

        XCTAssertEqual(CreateEntityAnimationCommand.commandType, "CreateEntityAnimation")
        XCTAssertEqual(command.id, "entity-1")
        XCTAssertEqual(command.timeline.loop, .options(reverse: true))
        XCTAssertEqual(command.timeline.loop.mode, .reverse)
        XCTAssertEqual(
            try jsonObject(JSONEncoder().encode(command)),
            try jsonObject(Data(json.utf8))
        )
        XCTAssertEqual(
            try jsonObject(JSONEncoder().encode(CreateEntityAnimationResult(id: "animation-1"))),
            ["id": "animation-1"]
        )
    }

    /// Confirms every control uses the animation object id.
    func testControlCommandsUseAnimationObjectId() throws {
        for type in EntityAnimationControlType.allCases {
            let command = ControlEntityAnimationCommand(id: "animation-1", type: type)
            let encoded = try JSONEncoder().encode(command)
            let decoded = try JSONDecoder().decode(
                ControlEntityAnimationCommand.self,
                from: encoded
            )

            XCTAssertEqual(decoded, command)
            XCTAssertEqual(
                try jsonObject(encoded),
                ["id": "animation-1", "type": type.rawValue]
            )
        }
    }

    /// Confirms set accepts sparse axes and replies with one complete pose.
    func testSetCommandAndConfirmedReplyRoundTrip() throws {
        let command = SetEntityAnimationCommand(
            id: "animation-1",
            update: EntityMotionTransformPayload(
                position: .init(x: nil, y: 0.3, z: nil),
                rotation: .init(x: nil, y: nil, z: 15),
                scale: nil
            )
        )
        let values = EntityMotionConfirmedTransformPayload(
            position: .init(x: 1, y: 2, z: 3),
            rotation: .init(x: 4, y: 5, z: 6),
            scale: .init(x: 1, y: 1, z: 1)
        )
        let result = SetEntityAnimationResult(values: values)

        XCTAssertEqual(
            try JSONDecoder().decode(
                SetEntityAnimationCommand.self,
                from: JSONEncoder().encode(command)
            ),
            command
        )
        XCTAssertEqual(
            try JSONDecoder().decode(
                SetEntityAnimationResult.self,
                from: JSONEncoder().encode(result)
            ),
            result
        )
        XCTAssertEqual(result.values.position.x, 1)
        XCTAssertEqual(result.values.rotation.z, 6)
        XCTAssertEqual(result.values.scale.y, 1)
    }

    /// Confirms update replaces the canonical timeline and returns its committed revision.
    func testUpdateCommandAndConfirmedReplyRoundTrip() throws {
        let timeline = EntityMotionTimelinePayload(
            duration: 2,
            delay: 0.25,
            playbackRate: 1.5,
            loop: .disabled,
            tracks: [
                EntityMotionTrackPayload(
                    property: "position.x",
                    keyframes: [
                        .init(at: 0, value: 0, timingFunction: nil),
                        .init(at: 2, value: 4, timingFunction: nil),
                    ],
                    timingFunction: .linear
                ),
            ]
        )
        let command = UpdateEntityAnimationCommand(
            id: "animation-1",
            timeline: timeline
        )
        let values = EntityMotionConfirmedTransformPayload(
            position: .init(x: 1, y: 2, z: 3),
            rotation: .init(x: 4, y: 5, z: 6),
            scale: .init(x: 1, y: 1, z: 1)
        )
        let result = UpdateEntityAnimationResult(values: values, revision: 1)

        XCTAssertEqual(UpdateEntityAnimationCommand.commandType, "UpdateEntityAnimation")
        XCTAssertEqual(
            try JSONDecoder().decode(
                UpdateEntityAnimationCommand.self,
                from: JSONEncoder().encode(command)
            ),
            command
        )
        XCTAssertEqual(
            try JSONDecoder().decode(
                UpdateEntityAnimationResult.self,
                from: JSONEncoder().encode(result)
            ),
            result
        )
        XCTAssertEqual(result.values.position.x, 1)
        XCTAssertEqual(result.revision, 1)
    }

    /// Confirms lifecycle state and asynchronous errors encode their dedicated channels.
    func testStateAndErrorMessagesEncodeDedicatedChannels() throws {
        let values = EntityMotionConfirmedTransformPayload(
            position: .init(x: 1, y: 2, z: 3),
            rotation: .init(x: 4, y: 5, z: 6),
            scale: .init(x: 1, y: 1, z: 1)
        )
        let state = EntityMotionStateChangedMessage(
            detail: .init(
                id: "animation-1",
                revision: 1,
                playState: .finished,
                callbackAction: .complete,
                values: values
            )
        )
        let stateOnly = EntityMotionStateChangedMessage(
            detail: .init(
                id: "animation-1",
                revision: 1,
                playState: .paused,
                callbackAction: nil,
                values: nil
            )
        )
        let error = EntityAnimationErrorMessage(
            detail: .init(
                id: "animation-1",
                error: .init(code: .compilationFailed, reason: "failed")
            )
        )

        XCTAssertEqual(
            try jsonObject(JSONEncoder().encode(state)),
            [
                "type": "spatialanimationstatechanged",
                "detail": [
                    "id": "animation-1",
                    "revision": 1,
                    "playState": "finished",
                    "callbackAction": "complete",
                    "values": [
                        "position": ["x": 1, "y": 2, "z": 3],
                        "rotation": ["x": 4, "y": 5, "z": 6],
                        "scale": ["x": 1, "y": 1, "z": 1],
                    ],
                ],
            ]
        )
        XCTAssertEqual(
            try jsonObject(JSONEncoder().encode(stateOnly)),
            [
                "type": "spatialanimationstatechanged",
                "detail": ["id": "animation-1", "revision": 1, "playState": "paused"],
            ]
        )
        XCTAssertEqual(
            try jsonObject(JSONEncoder().encode(error)),
            [
                "type": "entityanimationerror",
                "detail": [
                    "id": "animation-1",
                    "error": [
                        "code": "COMPILATION_FAILED",
                        "reason": "failed",
                    ],
                ],
            ]
        )

        let incompleteConfirmation = #"""
        {
          "values":{
            "position":{"x":1,"y":2},
            "rotation":{"x":4,"y":5,"z":6},
            "scale":{"x":1,"y":1,"z":1}
          }
        }
        """#
        XCTAssertThrowsError(
            try JSONDecoder().decode(
                SetEntityAnimationResult.self,
                from: Data(incompleteConfirmation.utf8)
            )
        )

        let incompleteUpdateConfirmation = #"""
        {
          "values":{
            "position":{"x":1,"y":2,"z":3},
            "rotation":{"x":4,"y":5,"z":6},
            "scale":{"x":1,"y":1,"z":1}
          }
        }
        """#
        XCTAssertThrowsError(
            try JSONDecoder().decode(
                UpdateEntityAnimationResult.self,
                from: Data(incompleteUpdateConfirmation.utf8)
            )
        )
    }

    /// Confirms the stable playback error set is closed and available to JSB replies.
    func testStableErrorCodesEncodeAsExactJSONStrings() throws {
        let expected = [
            "TARGET_NOT_FOUND",
            "UNSUPPORTED_TARGET",
            "ANIMATION_NOT_FOUND",
            "INVALID_TIMELINE",
            "COMPILATION_FAILED",
            "INVALID_CONTROL_STATE",
            "INVALID_SET_VALUES",
        ]

        XCTAssertEqual(EntityMotionErrorCode.allCases.map(\.rawValue), expected)
        XCTAssertEqual(
            EntityMotionErrorCode.allCases.map { ReplyCode(entityMotion: $0).rawValue },
            expected
        )
        for code in EntityMotionErrorCode.allCases {
            XCTAssertEqual(
                try String(data: JSONEncoder().encode(code), encoding: .utf8),
                "\"\(code.rawValue)\""
            )
        }

        let reply = JsbErrorData(
            code: .INVALID_TIMELINE,
            message: "invalid"
        )
        XCTAssertEqual(
            try jsonObject(JSONEncoder().encode(reply)),
            ["code": "INVALID_TIMELINE", "message": "invalid"]
        )
    }

    /// Confirms every canonical loop wire shape and rejects non-loop JSON types.
    func testLoopCodecPreservesCanonicalShapesAndRejectsUnknownObjectKeys() throws {
        let fixtures: [(String, EntityMotionLoopPayload)] = [
            ("false", .disabled),
            ("true", .enabled),
            ("{}", .options(reverse: nil)),
            (#"{"reverse":false}"#, .options(reverse: false)),
            (#"{"reverse":true}"#, .options(reverse: true)),
        ]
        for (json, expected) in fixtures {
            let decoded = try JSONDecoder().decode(
                EntityMotionLoopPayload.self,
                from: Data(json.utf8)
            )
            XCTAssertEqual(decoded, expected)
            XCTAssertEqual(
                try JSONSerialization.jsonObject(
                    with: JSONEncoder().encode(decoded),
                    options: .fragmentsAllowed
                ) as! NSObject,
                try JSONSerialization.jsonObject(
                    with: Data(json.utf8),
                    options: .fragmentsAllowed
                ) as! NSObject
            )
        }

        XCTAssertEqual(EntityMotionLoopPayload.disabled.mode, .none)
        XCTAssertEqual(EntityMotionLoopPayload.enabled.mode, .reset)
        XCTAssertEqual(EntityMotionLoopPayload.options(reverse: nil).mode, .reset)
        XCTAssertEqual(EntityMotionLoopPayload.options(reverse: false).mode, .reset)
        XCTAssertEqual(EntityMotionLoopPayload.options(reverse: true).mode, .reverse)

        for json in [
            "0",
            #""loop""#,
            "[]",
            "null",
            #"{"unknown":true}"#,
            #"{"reverse":true,"unknown":false}"#,
        ] {
            XCTAssertThrowsError(
                try JSONDecoder().decode(
                    EntityMotionLoopPayload.self,
                    from: Data(json.utf8)
                )
            )
        }
    }

    /// Confirms closed enum codecs reject unknown easing and control strings.
    func testClosedCommandEnumsRejectUnknownStrings() {
        XCTAssertThrowsError(
            try JSONDecoder().decode(
                EntityMotionTimingFunction.self,
                from: Data(#""spring""#.utf8)
            )
        )
        XCTAssertThrowsError(
            try JSONDecoder().decode(
                ControlEntityAnimationCommand.self,
                from: Data(#"{"id":"animation-1","type":"seek"}"#.utf8)
            )
        )
    }

    /// Confirms malformed Entity commands receive one stable synchronous JSB failure reply.
    func testMalformedEntityCommandsReplyExactlyOnceThroughHandlerMessage() throws {
        let manager = JSBManager()
        manager.register(CreateEntityAnimationCommand.self)
        manager.register(UpdateEntityAnimationCommand.self)
        manager.register(ControlEntityAnimationCommand.self)
        manager.register(SetEntityAnimationCommand.self)

        let fixtures = [
            (
                "CreateEntityAnimation",
                #"{"id":"entity-1","timeline":{"duration":1,"delay":0,"playbackRate":1,"loop":{"unknown":true},"tracks":[]}}"#,
                "INVALID_TIMELINE"
            ),
            (
                "CreateEntityAnimation",
                #"{"id":"entity-1","timeline":{"duration":1,"delay":0,"playbackRate":1,"loop":false,"tracks":[{"property":"position.x","keyframes":[{"at":0,"value":0}],"timingFunction":"spring"}]}}"#,
                "INVALID_TIMELINE"
            ),
            (
                "ControlEntityAnimation",
                #"{"id":"animation-1","type":"seek"}"#,
                "INVALID_CONTROL_STATE"
            ),
            (
                "UpdateEntityAnimation",
                #"{"id":"animation-1","timeline":{"duration":1,"delay":0,"playbackRate":1,"loop":{"unknown":true},"tracks":[]}}"#,
                "INVALID_TIMELINE"
            ),
            (
                "SetEntityAnimation",
                #"{"id":"animation-1"}"#,
                "INVALID_SET_VALUES"
            ),
            (
                "CreateEntityAnimation",
                "",
                "INVALID_TIMELINE"
            ),
            (
                "ControlEntityAnimation",
                "",
                "INVALID_CONTROL_STATE"
            ),
            (
                "UpdateEntityAnimation",
                "",
                "INVALID_TIMELINE"
            ),
            (
                "SetEntityAnimation",
                "",
                "INVALID_SET_VALUES"
            ),
        ]

        for (command, payload, expectedCode) in fixtures {
            var callbackCount = 0
            let expectation = expectation(description: "\(command) malformed reply")
            manager.handlerMessage("\(command)::\(payload)") { result, error in
                callbackCount += 1
                XCTAssertNil(result)
                XCTAssertEqual(
                    try? self.jsonObject(Data((error ?? "").utf8)),
                    ["code": expectedCode, "message": "Invalid command payload."]
                )
                expectation.fulfill()
            }
            wait(for: [expectation], timeout: 1)
            XCTAssertEqual(callbackCount, 1)
        }
    }

    /// Converts encoded JSON into Foundation containers for order-independent parity checks.
    private func jsonObject(_ data: Data) throws -> NSDictionary {
        try JSONSerialization.jsonObject(with: data) as! NSDictionary
    }
}

final class EntityMotionSpatialSceneHandlerTests: XCTestCase {
    /// Confirms create rejects invalid targets and registers a valid animation object.
    func testCreateHandlerRejectsInvalidTargetsAndRegistersAnimation() throws {
        let scene = makeScene()
        defer { scene.destroy() }

        let missingReply = try send(
            CreateEntityAnimationCommand(id: "missing-entity", timeline: makeTimeline()),
            through: scene
        )
        XCTAssertEqual(missingReply.error?["code"] as? String, "TARGET_NOT_FOUND")

        let unsupportedTarget = scene.createSpatializedElement(.Spatialized2DElement)
        let unsupportedReply = try send(
            CreateEntityAnimationCommand(id: unsupportedTarget.id, timeline: makeTimeline()),
            through: scene
        )
        XCTAssertEqual(unsupportedReply.error?["code"] as? String, "UNSUPPORTED_TARGET")

        let target = scene.createEntity(command: CreateSpatialEntity(name: "motion-target"))
        let createReply = try send(
            CreateEntityAnimationCommand(id: target.spatialId, timeline: makeTimeline()),
            through: scene
        )
        let animationId = try XCTUnwrap(
            (createReply.result as? [String: Any])?["id"] as? String
        )
        let registered: EntityMotionAnimationObject? = scene.findSpatialObject(animationId)

        XCTAssertNil(createReply.error)
        XCTAssertNotNil(registered)
        XCTAssertEqual(registered?.targetEntityId, target.spatialId)
    }

    /// Confirms explicit destroy removes the object and all later handlers report teardown.
    func testExplicitDestroyRemovesAnimationAndLaterHandlersReportNotFound() throws {
        let scene = makeScene()
        defer { scene.destroy() }
        let animationId = try createAnimation(in: scene)

        let destroyReply = try send(
            ControlEntityAnimationCommand(id: animationId, type: .destroy),
            through: scene
        )

        XCTAssertNil(destroyReply.error)
        XCTAssertNil(scene.findSpatialObject(animationId) as EntityMotionAnimationObject?)

        let replies = try [
            send(
                UpdateEntityAnimationCommand(id: animationId, timeline: makeTimeline()),
                through: scene
            ),
            send(
                ControlEntityAnimationCommand(id: animationId, type: .pause),
                through: scene
            ),
            send(
                SetEntityAnimationCommand(
                    id: animationId,
                    update: .init(
                        position: .init(x: 1, y: nil, z: nil),
                        rotation: nil,
                        scale: nil
                    )
                ),
                through: scene
            ),
        ]

        XCTAssertTrue(replies.allSatisfy {
            $0.error?["code"] as? String == "ANIMATION_NOT_FOUND"
        })
    }

    /// Confirms target-first destruction cascades through the scene registry.
    func testTargetDestructionCascadesAnimationCleanup() throws {
        let scene = makeScene()
        defer { scene.destroy() }
        let target = scene.createEntity(command: CreateSpatialEntity(name: "motion-target"))
        let animationId = try createAnimation(in: scene, target: target)

        target.destroy()

        XCTAssertNil(scene.findSpatialObject(target.spatialId) as SpatialEntity?)
        XCTAssertNil(scene.findSpatialObject(animationId) as EntityMotionAnimationObject?)

        let teardownReply = try send(
            ControlEntityAnimationCommand(id: animationId, type: .stop),
            through: scene
        )
        XCTAssertEqual(teardownReply.error?["code"] as? String, "ANIMATION_NOT_FOUND")
    }

    /// Creates one isolated scene with all production JSB handlers registered.
    private func makeScene() -> SpatialScene {
        SpatialScene("", .window, .visible, nil)
    }

    /// Creates one registered animation through the production create handler.
    private func createAnimation(
        in scene: SpatialScene,
        target: SpatialEntity? = nil
    ) throws -> String {
        let target = target
            ?? scene.createEntity(command: CreateSpatialEntity(name: "motion-target"))
        let reply = try send(
            CreateEntityAnimationCommand(id: target.spatialId, timeline: makeTimeline()),
            through: scene
        )
        XCTAssertNil(reply.error)
        return try XCTUnwrap((reply.result as? [String: Any])?["id"] as? String)
    }

    /// Sends one command through the registered JSB path and captures its reply.
    private func send<T: CommandDataProtocol & Encodable>(
        _ command: T,
        through scene: SpatialScene
    ) throws -> (result: Any?, error: NSDictionary?) {
        let payload = try XCTUnwrap(
            String(data: JSONEncoder().encode(command), encoding: .utf8)
        )
        let replyExpectation = expectation(description: "\(T.commandType) reply")
        var result: Any?
        var replyError: NSDictionary?

        scene.spatialWebViewModel.getController()
            .mockJSB("\(T.commandType)::\(payload)") { value, error in
                result = value
                if let error {
                    replyError = try? JSONSerialization.jsonObject(
                        with: Data(error.utf8)
                    ) as? NSDictionary
                }
                replyExpectation.fulfill()
            }

        wait(for: [replyExpectation], timeout: 1)
        return (result, replyError)
    }

    /// Creates the smallest valid native Entity motion timeline.
    private func makeTimeline() -> EntityMotionTimelinePayload {
        EntityMotionTimelinePayload(
            duration: 1,
            delay: 0,
            playbackRate: 1,
            loop: .disabled,
            tracks: [
                .init(
                    property: "position.x",
                    keyframes: [
                        .init(at: 0, value: 0, timingFunction: nil),
                        .init(at: 1, value: 1, timingFunction: nil),
                    ],
                    timingFunction: .linear
                ),
            ]
        )
    }
}

final class EntityMotionTimelineCompilerTests: XCTestCase {
    /// Keeps validation and compilation aligned on timeline contract failures.
    func testValidateAndCompileReportTheSameTimelineErrors() {
        let valid = makeTimeline()
        let cases: [(EntityMotionTimelinePayload, String)] = [
            (
                valid.replacing(duration: 0),
                "Timeline timing or tracks are invalid."
            ),
            (
                valid.replacing(property: "opacity"),
                "Track property is unsupported, duplicated, or empty."
            ),
            (
                valid.replacingKeyframe(at: .nan),
                "Keyframes must be finite, ordered, unique, and in range."
            ),
            (
                valid.removingStartBoundary(),
                "Timeline requires both boundaries and one global timing default."
            ),
            (
                valid.replacing(tracks: [
                    track("position.x", [(0, 0), (2, 2)], timing: .linear),
                    track("position.y", [(0, 0), (2, 2)], timing: .easeIn),
                ]),
                "Timeline requires both boundaries and one global timing default."
            ),
        ]

        for (timeline, reason) in cases {
            let expected = EntityMotionCompilationError.invalidTimeline(reason)
            XCTAssertThrowsError(
                try EntityMotionTimelineCompiler.validate(timeline)
            ) { error in
                XCTAssertEqual(error as? EntityMotionCompilationError, expected)
            }
            XCTAssertThrowsError(
                try EntityMotionTimelineCompiler.compile(
                    timeline,
                    baseline: .identity
                )
            ) { error in
                XCTAssertEqual(error as? EntityMotionCompilationError, expected)
            }
        }
    }

    /// Keeps baseline validation in compilation rather than timeline validation.
    func testCompileRejectsInvalidBaselineAfterTimelineValidation() throws {
        let timeline = makeTimeline()
        XCTAssertNoThrow(try EntityMotionTimelineCompiler.validate(timeline))
        let baseline = EntityMotionPose(
            position: .init(.nan, 0, 0),
            rotation: .zero,
            scale: .one
        )

        XCTAssertThrowsError(
            try EntityMotionTimelineCompiler.compile(
                timeline,
                baseline: baseline
            )
        ) { error in
            XCTAssertEqual(
                error as? EntityMotionCompilationError,
                .invalidTimeline(
                    "Timeline timing, tracks, or baseline is invalid."
                )
            )
        }
    }

    /// Rejects unsupported properties and malformed numeric timeline inputs.
    func testCompilerRejectsMalformedNativePayloads() {
        let valid = makeTimeline()
        assertInvalid(valid.replacing(property: "opacity"))
        assertInvalid(valid.replacing(duration: 0))
        assertInvalid(valid.replacing(delay: -1))
        assertInvalid(valid.replacing(playbackRate: 0))
        assertInvalid(valid.replacing(tracks: []))
        assertInvalid(valid.replacingKeyframe(at: .nan))
        assertInvalid(valid.replacingKeyframe(value: .infinity))
        assertInvalid(valid.replacingKeyframe(at: 3))
        assertInvalid(valid.replacing(property: "scale.x", value: -1))
        assertInvalid(valid.removingStartBoundary())
        assertInvalid(valid.removingEndBoundary())
        assertInvalid(valid.replacing(tracks: [
            .init(property: "position.x", keyframes: [], timingFunction: .linear),
        ]))
        assertInvalid(valid.replacing(tracks: valid.tracks + valid.tracks))
        assertInvalid(valid.replacing(tracks: [
            track("position.x", [(0, 0), (0, 1), (2, 2)]),
        ]))
        assertInvalid(valid.replacing(tracks: [
            track("position.x", [(0, 0), (2, 2), (1, 1)]),
        ]))
    }

    /// Rejects finite extreme inputs when interpolation would produce a non-finite pose.
    func testCompilerRejectsNonFiniteInterpolatedUnionSliceAtomically() {
        let timeline = EntityMotionTimelinePayload(
            duration: 2,
            delay: 0,
            playbackRate: 1,
            loop: .disabled,
            tracks: [
                track(
                    "position.x",
                    [
                        (0, -Double.greatestFiniteMagnitude),
                        (2, Double.greatestFiniteMagnitude),
                    ]
                ),
                track("position.y", [(0, 0), (1, 1), (2, 2)]),
            ]
        )

        assertInvalid(timeline)
    }

    /// Builds union slice times and fills every pose scalar from tracks or the run baseline.
    func testCompilerBuildsFullPoseSlicesFromUnionTimesAndBaseline() throws {
        let timeline = EntityMotionTimelinePayload(
            duration: 2,
            delay: 0,
            playbackRate: 1,
            loop: .disabled,
            tracks: [
                track("position.x", [(0, 0), (1, 10), (2, 20)]),
                track("rotation.y", [(0, 0), (2, 90)]),
                track("scale.z", [(0, 1), (2, 2)]),
            ]
        )
        let baseline = EntityMotionPose(
            position: .init(1, 2, 3),
            rotation: .init(4, 5, 6),
            scale: .init(1, 1, 1)
        )

        let compiled = try EntityMotionTimelineCompiler.compile(
            timeline,
            baseline: baseline
        )

        XCTAssertEqual(compiled.slices.map(\.at), [0, 1, 2])
        XCTAssertEqual(compiled.slices[1].pose.position, .init(10, 2, 3))
        XCTAssertEqual(compiled.slices[1].pose.rotation, .init(4, 45, 6))
        XCTAssertEqual(compiled.slices[1].pose.scale, .init(1, 1, 1.5))
        XCTAssertEqual(compiled.segments.count, 2)
        XCTAssertEqual(compiled.segments[0].from, compiled.slices[0].pose)
        XCTAssertEqual(compiled.segments[0].to, compiled.slices[1].pose)
        XCTAssertEqual(compiled.segments[0].to, compiled.segments[1].from)
        XCTAssertEqual(compiled.segments[1].to, compiled.slices[2].pose)
        XCTAssertEqual(compiled.segments[0].from.confirmedPayload.position.z, 3)
        XCTAssertEqual(compiled.segments[1].to.confirmedPayload.rotation.y, 90)
        XCTAssertEqual(compiled.segments[1].to.confirmedPayload.scale.z, 2)
    }

    /// Keeps the compiled timeline limited to data consumed by playback.
    func testCompiledTimelineStoresOnlyPlaybackData() throws {
        let compiled = try EntityMotionTimelineCompiler.compile(
            makeTimeline(),
            baseline: .identity
        )

        XCTAssertEqual(
            Mirror(reflecting: compiled).children.compactMap(\.label),
            ["slices", "segments"]
        )
    }

    /// Interpolates from the time-zero baseline when a channel begins after zero.
    func testLateFirstChannelInterpolatesFromBaselineInsteadOfHolding() throws {
        let timeline = EntityMotionTimelinePayload(
            duration: 2,
            delay: 0,
            playbackRate: 1,
            loop: .disabled,
            tracks: [
                track("position.x", [(0, 0), (0.5, 5), (1, 10), (2, 20)]),
                track("position.y", [(1, 12), (2, 22)]),
            ]
        )
        let baseline = EntityMotionPose(
            position: .init(0, 2, 0),
            rotation: .zero,
            scale: .one
        )

        let compiled = try EntityMotionTimelineCompiler.compile(
            timeline,
            baseline: baseline
        )

        XCTAssertEqual(compiled.slices.map(\.at), [0, 0.5, 1, 2])
        XCTAssertEqual(compiled.slices[0].pose.position.y, 2, accuracy: 1e-9)
        XCTAssertEqual(compiled.slices[1].pose.position.y, 7, accuracy: 1e-9)
        XCTAssertEqual(compiled.slices[2].pose.position.y, 12, accuracy: 1e-9)
    }

    /// Resolves keyframe easing before track easing and rejects cross-track conflicts.
    func testCompilerResolvesClosedEasingAndRejectsConflicts() throws {
        for timing in EntityMotionTimingFunction.allCases {
            let timeline = makeTimeline(
                trackTiming: .linear,
                keyframeTiming: timing
            )
            let compiled = try EntityMotionTimelineCompiler.compile(
                timeline,
                baseline: .identity
            )
            XCTAssertEqual(compiled.segments[0].timing, timing)
            let resource = try EntityMotionAnimationObject.makeAnimationResource(
                compiled: compiled,
                timeline: timeline
            )
            let animation = try XCTUnwrap(
                resource.definition as? FromToByAnimation<Transform>
            )
            XCTAssertEqual(animation.bindTarget, .transform)
        }

        let sparse = EntityMotionTimelinePayload(
            duration: 2,
            delay: 0,
            playbackRate: 1,
            loop: .disabled,
            tracks: [
                .init(
                    property: "position.x",
                    keyframes: [
                        .init(at: 0, value: 0, timingFunction: nil),
                        .init(at: 1, value: 1, timingFunction: .easeOut),
                        .init(at: 2, value: 2, timingFunction: nil),
                    ],
                    timingFunction: .linear
                ),
                track("rotation.y", [(0, 0), (2, 90)], timing: .linear),
            ]
        )
        let sparseCompiled = try EntityMotionTimelineCompiler.compile(
            sparse,
            baseline: .identity
        )
        XCTAssertEqual(sparseCompiled.segments[1].timing, .easeOut)

        let driftingDefaults = EntityMotionTimelinePayload(
            duration: 2,
            delay: 0,
            playbackRate: 1,
            loop: .disabled,
            tracks: [
                .init(
                    property: "position.x",
                    keyframes: [
                        .init(at: 0, value: 0, timingFunction: .easeOut),
                        .init(at: 2, value: 1, timingFunction: nil),
                    ],
                    timingFunction: .linear
                ),
                .init(
                    property: "position.y",
                    keyframes: [
                        .init(at: 0, value: 0, timingFunction: .easeOut),
                        .init(at: 2, value: 1, timingFunction: nil),
                    ],
                    timingFunction: .easeIn
                ),
            ]
        )
        assertInvalid(driftingDefaults)

        let conflicting = EntityMotionTimelinePayload(
            duration: 2,
            delay: 0,
            playbackRate: 1,
            loop: .disabled,
            tracks: [
                .init(
                    property: "position.x",
                    keyframes: [
                        .init(at: 0, value: 0, timingFunction: .easeIn),
                        .init(at: 2, value: 1, timingFunction: nil),
                    ],
                    timingFunction: .linear
                ),
                .init(
                    property: "position.y",
                    keyframes: [
                        .init(at: 0, value: 0, timingFunction: .easeOut),
                        .init(at: 2, value: 1, timingFunction: nil),
                    ],
                    timingFunction: .linear
                ),
            ]
        )
        assertInvalid(conflicting)
    }

    /// Produces deterministic canonical Euler values for equivalent quaternions and lock cases.
    func testEulerZYXRoundTripEquivalentQuaternionAndGimbalLock() throws {
        let euler = SIMD3<Double>(35, -20, 140)
        let quaternion = EntityMotionTransformValues.composeEulerZYX(euler)
        let equivalent = simd_quatd(
            vector: -quaternion.vector
        )

        try assertVectorEqual(
            EntityMotionTransformValues.decomposeEulerZYX(quaternion),
            EntityMotionTransformValues.decomposeEulerZYX(equivalent),
            accuracy: 1e-9
        )

        for lock in [90.0, -90.0] {
            let source = EntityMotionTransformValues.composeEulerZYX(
                .init(25, lock, 40)
            )
            let canonical = try EntityMotionTransformValues.decomposeEulerZYX(
                source
            )
            XCTAssertEqual(canonical.y, lock, accuracy: 1e-8)
            XCTAssertEqual(canonical.z, 0, accuracy: 1e-8)
            XCTAssertEqual(
                canonical.x,
                lock > 0 ? -15 : 65,
                accuracy: 1e-8
            )
            let recomposed = EntityMotionTransformValues.composeEulerZYX(canonical)
            XCTAssertEqual(
                abs(simd_dot(source.vector, recomposed.vector)),
                1,
                accuracy: 1e-9
            )
        }

        let known = simd_double3x3(
            EntityMotionTransformValues.composeEulerZYX(.init(90, 0, 90))
        )
        XCTAssertEqual(known[0][0], 0, accuracy: 1e-9)
        XCTAssertEqual(known[0][1], 1, accuracy: 1e-9)
        XCTAssertEqual(known[2][0], 1, accuracy: 1e-9)
        XCTAssertEqual(known[1][2], 1, accuracy: 1e-9)
        let canonicalHalfTurn = try EntityMotionTransformValues.decomposeEulerZYX(
            EntityMotionTransformValues.composeEulerZYX(.init(-180, 0, 0))
        )
        XCTAssertEqual(canonicalHalfTurn.x, 180, accuracy: 1e-9)
    }

    /// Reads RealityKit Transform components without losing rotation at zero scale.
    func testRealityKitTransformReadbackSupportsEquivalentQuaternionAndZeroScale() throws {
        let composed = EntityMotionTransformValues.composeEulerZYX(.init(220, 15, -35))
        let rotation = simd_quatf(
            ix: Float(composed.imag.x),
            iy: Float(composed.imag.y),
            iz: Float(composed.imag.z),
            r: Float(composed.real)
        )
        let transform = Transform(
            scale: .init(0, 2, 3),
            rotation: rotation,
            translation: .init(0.123456789, -2, 4)
        )
        let equivalent = Transform(
            scale: transform.scale,
            rotation: simd_quatf(vector: -rotation.vector),
            translation: transform.translation
        )

        let first = try EntityMotionTransformValues.decompose(transform)
        let second = try EntityMotionTransformValues.decompose(equivalent)

        assertVectorEqual(first.rotation, second.rotation, accuracy: 1e-8)
        XCTAssertEqual(first.scale, .init(0, 2, 3))
        XCTAssertGreaterThan(first.rotation.x, -180)
        XCTAssertLessThanOrEqual(first.rotation.x, 180)
    }

    /// Merges sparse rotation on the canonical baseline.
    func testSparseMergeUsesCanonicalEuler() throws {
        let baseline = EntityMotionPose(
            position: .init(1, 2, 3),
            rotation: .init(10, 20, 30),
            scale: .init(1, 2, 3)
        )
        let merged = try EntityMotionTransformValues.merge(
            EntityMotionTransformPayload(
                position: .init(x: nil, y: 9, z: nil),
                rotation: .init(x: nil, y: nil, z: 45),
                scale: nil
            ),
            onto: baseline
        )

        XCTAssertEqual(merged.position, .init(1, 9, 3))
        assertVectorEqual(merged.rotation, .init(10, 20, 45), accuracy: 1e-9)
        XCTAssertEqual(merged.scale, baseline.scale)
        XCTAssertEqual(merged.confirmedPayload.position, .init(x: 1, y: 9, z: 3))
        XCTAssertEqual(merged.confirmedPayload.rotation.z, 45, accuracy: 1e-9)
        XCTAssertEqual(merged.confirmedPayload.scale, .init(x: 1, y: 2, z: 3))

        XCTAssertThrowsError(
            try EntityMotionTransformValues.merge(
                .init(
                    position: .init(x: nil, y: nil, z: nil),
                    rotation: nil,
                    scale: nil
                ),
                onto: baseline
            )
        )
    }

    /// Asserts one timeline is rejected with the stable invalid-timeline error.
    private func assertInvalid(
        _ timeline: EntityMotionTimelinePayload,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        XCTAssertThrowsError(
            try EntityMotionTimelineCompiler.compile(
                timeline,
                baseline: .identity
            ),
            file: file,
            line: line
        )
    }

    /// Creates the smallest valid two-boundary timeline.
    private func makeTimeline(
        trackTiming: EntityMotionTimingFunction = .linear,
        keyframeTiming: EntityMotionTimingFunction? = nil
    ) -> EntityMotionTimelinePayload {
        EntityMotionTimelinePayload(
            duration: 2,
            delay: 0,
            playbackRate: 1,
            loop: .disabled,
            tracks: [
                EntityMotionTrackPayload(
                    property: "position.x",
                    keyframes: [
                        .init(at: 0, value: 0, timingFunction: keyframeTiming),
                        .init(at: 2, value: 1, timingFunction: nil),
                    ],
                    timingFunction: trackTiming
                ),
            ]
        )
    }

    /// Creates one canonical track from compact test tuples.
    private func track(
        _ property: String,
        _ frames: [(Double, Double)],
        timing: EntityMotionTimingFunction = .linear
    ) -> EntityMotionTrackPayload {
        EntityMotionTrackPayload(
            property: property,
            keyframes: frames.map {
                EntityMotionKeyframePayload(
                    at: $0.0,
                    value: $0.1,
                    timingFunction: nil
                )
            },
            timingFunction: timing
        )
    }

    /// Asserts all vector components with one shared floating-point accuracy.
    private func assertVectorEqual(
        _ lhs: SIMD3<Double>,
        _ rhs: SIMD3<Double>,
        accuracy: Double,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        XCTAssertEqual(lhs.x, rhs.x, accuracy: accuracy, file: file, line: line)
        XCTAssertEqual(lhs.y, rhs.y, accuracy: accuracy, file: file, line: line)
        XCTAssertEqual(lhs.z, rhs.z, accuracy: accuracy, file: file, line: line)
    }
}

final class EntityMotionAnimationObjectTests: XCTestCase {
    /// Confirms fresh playback snapshots the Entity transform and locks external transform writes.
    func testPlayUsesCurrentEntityTransformAsBaselineAndLocksWrites() throws {
        let entity = SpatialEntity("entity-motion-target")
        entity.transform.translation = SIMD3<Float>(2, 3, 4)
        let animation = try EntityMotionAnimationObject(
            id: "animation-1",
            target: entity,
            timeline: timeline(
                duration: 1,
                delay: 0.5,
                tracks: [
                    track("position.x", [(0, 0), (1, 10)]),
                ]
            )
        )

        try animation.play(at: 10)

        XCTAssertEqual(animation.playState, .running)
        XCTAssertFalse(entity.entityMotionAllowsExternalTransformWrite)
        let protectedTranslation = entity.transform.translation
        XCTAssertFalse(entity.updateTransform(translationMatrix(x: 20, y: 30, z: 40)))
        XCTAssertEqual(entity.transform.translation.x, protectedTranslation.x, accuracy: 1e-6)
        XCTAssertEqual(entity.transform.translation.y, protectedTranslation.y, accuracy: 1e-6)
        XCTAssertEqual(entity.transform.translation.z, protectedTranslation.z, accuracy: 1e-6)
        XCTAssertEqual(animation.confirmedValues.position.x, 0, accuracy: 1e-6)
        XCTAssertEqual(animation.confirmedValues.position.y, 3, accuracy: 1e-6)
        XCTAssertEqual(animation.confirmedValues.position.z, 4, accuracy: 1e-6)
    }

    /// Confirms creation and fresh playback preserve a valid zero-scale baseline.
    func testCreationAndPlayPreserveZeroScaleBaseline() throws {
        let entity = SpatialEntity("entity-motion-target")
        entity.transform.scale = .zero

        let animation = try EntityMotionAnimationObject(
            id: "animation-1",
            target: entity,
            timeline: timeline()
        )

        XCTAssertEqual(animation.playState, .idle)
        try animation.play()
        XCTAssertEqual(animation.playState, .running)
        XCTAssertEqual(animation.confirmedValues.scale, .zero)
        XCTAssertFalse(entity.entityMotionAllowsExternalTransformWrite)
    }

    /// Confirms a terminal replay fills omitted axes from the latest native transform.
    func testReplayAfterStopReadsLatestBaseline() throws {
        let entity = SpatialEntity("entity-motion-target")
        let animation = try EntityMotionAnimationObject(
            id: "animation-1",
            target: entity,
            timeline: timeline()
        )

        try animation.play()
        animation.stop()
        entity.transform.translation = SIMD3<Float>(4, 8, 12)
        try animation.play()

        XCTAssertEqual(animation.confirmedValues.position.x, 0, accuracy: 1e-6)
        XCTAssertEqual(animation.confirmedValues.position.y, 8, accuracy: 1e-6)
        XCTAssertEqual(animation.confirmedValues.position.z, 12, accuracy: 1e-6)
    }

    /// Confirms every terminal state starts a fresh run from the latest native baseline.
    func testReplayAfterEveryTerminalStateReadsLatestBaseline() throws {
        let terminalTransitions: [(EntityMotionAnimationObject) throws -> Void] = [
            { $0.stop() },
            { try $0.reset() },
            { try $0.finish() },
            { $0.completeNaturally() },
        ]

        for (index, transition) in terminalTransitions.enumerated() {
            let entity = SpatialEntity("entity-motion-target-\(index)")
            let animation = try EntityMotionAnimationObject(
                id: "animation-\(index)",
                target: entity,
                timeline: timeline()
            )

            try animation.play()
            try transition(animation)
            entity.transform.translation = SIMD3<Float>(4, 8, 12)
            try animation.play()

            XCTAssertEqual(animation.playState, .running)
            XCTAssertEqual(animation.confirmedValues.position.x, 0, accuracy: 1e-6)
            XCTAssertEqual(animation.confirmedValues.position.y, 8, accuracy: 1e-6)
            XCTAssertEqual(animation.confirmedValues.position.z, 12, accuracy: 1e-6)
        }
    }

    /// Confirms paused play resumes with state-only messages and no additional start callback.
    func testPausedPlayResumesCurrentRunWithStateOnlyMessages() throws {
        let entity = SpatialEntity("entity-motion-target")
        var messages: [EntityMotionStateChangedMessage] = []
        let animation = try EntityMotionAnimationObject(
            id: "animation-1",
            target: entity,
            timeline: timeline(),
            sendWebMsg: { _, message in
                if let state = message as? EntityMotionStateChangedMessage {
                    messages.append(state)
                }
            }
        )

        try animation.play()
        animation.pause()
        try animation.play()

        XCTAssertEqual(animation.playState, .running)
        XCTAssertEqual(messages.map(\.detail.playState), [.running, .paused, .running])
        XCTAssertEqual(messages.map(\.detail.callbackAction), [.start, nil, nil])
        XCTAssertNotNil(messages[0].detail.values)
        XCTAssertNil(messages[1].detail.values)
        XCTAssertNil(messages[2].detail.values)
        XCTAssertFalse(entity.entityMotionAllowsExternalTransformWrite)
    }

    /// Confirms a looping run keeps its current resource and ignores terminal completion delivery.
    func testLoopRunReusesCurrentResourceUntilExplicitControl() throws {
        let entity = SpatialEntity("entity-motion-target")
        var actions: [EntityMotionCallbackAction?] = []
        let animation = try EntityMotionAnimationObject(
            id: "animation-1",
            target: entity,
            timeline: timeline(loop: .enabled),
            sendWebMsg: { _, message in
                if let state = message as? EntityMotionStateChangedMessage {
                    actions.append(state.detail.callbackAction)
                }
            }
        )

        try animation.play()
        animation.completeNaturally()
        try animation.play()

        XCTAssertEqual(animation.playState, .running)
        XCTAssertEqual(actions, [.start])
        XCTAssertFalse(entity.entityMotionAllowsExternalTransformWrite)
    }

    /// Confirms adjacent full-pose segments compile through one RealityKit sequence.
    func testMultiSegmentResourceUsesSequenceAndWholeTransform() throws {
        let payload = timeline(
            duration: 2,
            delay: 0.25,
            playbackRate: 1.5,
            tracks: [
                track("position.x", [(0, 0), (1, 2), (2, 4)]),
                track("rotation.y", [(0, 0), (2, 90)]),
            ]
        )
        let compiled = try EntityMotionTimelineCompiler.compile(
            payload,
            baseline: .identity
        )

        let resource = try EntityMotionAnimationObject.makeAnimationResource(
            compiled: compiled,
            timeline: payload
        )

        let view = try XCTUnwrap(resource.definition as? AnimationView)
        XCTAssertNotEqual(view.bindTarget, .transform)
        let group = try XCTUnwrap(view.source as? AnimationGroup)
        XCTAssertEqual(group.group.count, compiled.segments.count)
        XCTAssertEqual(view.repeatMode, .none)
        XCTAssertEqual(view.delay, 0.25, accuracy: 1e-9)
        XCTAssertEqual(view.speed, 1.5, accuracy: 1e-6)
    }

    /// Confirms inactive `set` merges sparse values and active `set` is rejected.
    func testSetMergesOnlyWhenInactive() throws {
        let entity = SpatialEntity("entity-motion-target")
        let animation = try EntityMotionAnimationObject(
            id: "animation-1",
            target: entity,
            timeline: timeline()
        )

        let confirmed = try animation.set(
            EntityMotionTransformPayload(
                position: .init(x: 1, y: nil, z: nil),
                rotation: .init(x: nil, y: 45, z: nil),
                scale: .init(x: nil, y: nil, z: 2)
            )
        )

        XCTAssertEqual(confirmed.position.x, 1, accuracy: 1e-6)
        XCTAssertEqual(confirmed.position.y, 0, accuracy: 1e-6)
        XCTAssertEqual(confirmed.rotation.y, 45, accuracy: 1e-6)
        XCTAssertEqual(confirmed.scale.z, 2, accuracy: 1e-6)

        try animation.play(at: 0)
        XCTAssertThrowsError(
            try animation.set(EntityMotionTransformPayload(position: .init(x: 2, y: nil, z: nil), rotation: nil, scale: nil))
        ) { error in
            XCTAssertEqual(error as? EntityMotionAnimationObjectError, .invalidControlState("set is not allowed while animation is active"))
        }
    }

    /// Confirms every committed lifecycle pose and set reply uses the target's Float readback.
    func testLifecycleAndSetConfirmPostCommitRealityKitTransform() throws {
        let preciseStart = 0.123456789123
        let entity = SpatialEntity("entity-motion-target")
        var messages: [EntityMotionStateChangedMessage] = []
        let animation = try EntityMotionAnimationObject(
            id: "animation-1",
            target: entity,
            timeline: timeline(
                tracks: [
                    track("position.x", [(0, preciseStart), (1, 1.987654321987)]),
                    track("rotation.y", [(0, 220), (1, 90)]),
                    track("scale.x", [(0, 0), (1, 0.5)]),
                ]
            ),
            sendWebMsg: { _, message in
                if let state = message as? EntityMotionStateChangedMessage {
                    messages.append(state)
                }
            }
        )

        try animation.play(at: 0)
        try assertConfirmed(messages.last, matches: entity, action: .start)
        XCTAssertNotEqual(
            try XCTUnwrap(messages.last?.detail.values).position.x,
            preciseStart,
            accuracy: 1e-10
        )

        entity.transform.translation.y = Float(0.987654321987)
        animation.stop()
        try assertConfirmed(messages.last, matches: entity, action: .stop)

        try animation.reset()
        try assertConfirmed(messages.last, matches: entity, action: .reset)

        try animation.finish()
        try assertConfirmed(messages.last, matches: entity, action: .complete)

        try animation.play(at: 1)
        animation.completeNaturally()
        try assertConfirmed(messages.last, matches: entity, action: .complete)

        let setResult = try animation.set(
            EntityMotionTransformPayload(
                position: .init(x: nil, y: 0.333333333333, z: nil),
                rotation: .init(x: 25, y: 90, z: 40),
                scale: .init(x: 0, y: nil, z: nil)
            )
        )
        try assertPayload(setResult, matches: entity)
        XCTAssertEqual(setResult.scale.x, 0)
        XCTAssertEqual(setResult.rotation.y, 90, accuracy: 1e-5)
        XCTAssertEqual(setResult.rotation.z, 0, accuracy: 1e-5)
    }

    /// Confirms stop/reset/finish and natural completion release transform write ownership.
    func testTerminalTransitionsReleaseTransformWriteProtection() throws {
        let entity = SpatialEntity("entity-motion-target")
        let animation = try EntityMotionAnimationObject(
            id: "animation-1",
            target: entity,
            timeline: timeline()
        )

        try animation.play(at: 0)
        animation.stop(at: 0.5)
        XCTAssertEqual(animation.playState, .idle)
        XCTAssertTrue(entity.entityMotionAllowsExternalTransformWrite)
        XCTAssertTrue(entity.updateTransform(translationMatrix(x: 10)))
        XCTAssertEqual(entity.transform.translation.x, 10, accuracy: 1e-6)

        try animation.play(at: 1)
        try animation.reset()
        XCTAssertEqual(animation.playState, .idle)
        XCTAssertTrue(entity.entityMotionAllowsExternalTransformWrite)
        XCTAssertTrue(entity.updateTransform(translationMatrix(x: 20)))
        XCTAssertEqual(entity.transform.translation.x, 20, accuracy: 1e-6)

        try animation.play(at: 2)
        try animation.finish()
        XCTAssertEqual(animation.playState, .finished)
        XCTAssertTrue(entity.entityMotionAllowsExternalTransformWrite)
        XCTAssertTrue(entity.updateTransform(translationMatrix(x: 30)))
        XCTAssertEqual(entity.transform.translation.x, 30, accuracy: 1e-6)

        try animation.play(at: 3)
        animation.completeNaturally()
        XCTAssertEqual(animation.playState, .finished)
        XCTAssertTrue(entity.entityMotionAllowsExternalTransformWrite)
        XCTAssertTrue(entity.updateTransform(translationMatrix(x: 40)))
        XCTAssertEqual(entity.transform.translation.x, 40, accuracy: 1e-6)
    }

    /// Confirms stopping or destroying one Entity motion object preserves unrelated target and descendant controllers.
    func testControllerScopedCleanupPreservesUnrelatedAnimations() throws {
        let entity = SpatialEntity("entity-motion-target")
        let child = Entity()
        entity.addChild(child)
        let resource = try AnimationResource.generate(
            with: FromToByAnimation<Transform>(
                from: Transform(),
                to: Transform(translation: SIMD3<Float>(0.5, 0, 0)),
                duration: 60,
                bindTarget: .transform
            )
        )
        let targetController = entity.playAnimation(resource)
        let childController = child.playAnimation(resource)
        let animation = try EntityMotionAnimationObject(
            id: "animation-1",
            target: entity,
            timeline: timeline()
        )
        XCTAssertFalse(targetController.isStopped)
        XCTAssertFalse(childController.isStopped)

        try animation.play()
        animation.stop()

        XCTAssertFalse(targetController.isStopped)
        XCTAssertFalse(childController.isStopped)

        animation.destroy()

        XCTAssertFalse(targetController.isStopped)
        XCTAssertFalse(childController.isStopped)
    }

    /// Confirms repeated finish commands preserve the finished pose without duplicate lifecycle events.
    func testRepeatedFinishEmitsOneLifecycleEvent() throws {
        let entity = SpatialEntity("entity-motion-target")
        var actions: [EntityMotionCallbackAction?] = []
        let animation = try EntityMotionAnimationObject(
            id: "animation-1",
            target: entity,
            timeline: timeline(),
            sendWebMsg: { _, message in
                if let state = message as? EntityMotionStateChangedMessage {
                    actions.append(state.detail.callbackAction)
                }
            }
        )

        try animation.finish()
        try animation.finish()

        XCTAssertEqual(animation.playState, .finished)
        XCTAssertEqual(actions, [.complete])
    }

    /// Confirms finish commits the configured endpoint once for every loop mode.
    func testFinishCommitsEndpointOnceForEveryLoopMode() throws {
        let loopModes: [EntityMotionLoopPayload] = [
            .disabled,
            .enabled,
            .options(reverse: true),
        ]

        for (index, loop) in loopModes.enumerated() {
            let entity = SpatialEntity("entity-motion-target-\(index)")
            var messages: [EntityMotionStateChangedMessage] = []
            let animation = try EntityMotionAnimationObject(
                id: "animation-\(index)",
                target: entity,
                timeline: timeline(
                    loop: loop,
                    tracks: [
                        track("position.x", [(0, 1), (1, 4)]),
                    ]
                ),
                sendWebMsg: { _, message in
                    if let state = message as? EntityMotionStateChangedMessage {
                        messages.append(state)
                    }
                }
            )

            try animation.finish()
            try animation.finish()

            XCTAssertEqual(animation.playState, .finished)
            XCTAssertEqual(entity.transform.translation.x, 4, accuracy: 1e-6)
            XCTAssertEqual(messages.map(\.detail.callbackAction), [.complete])
            XCTAssertEqual(messages.last?.detail.playState, .finished)
        }
    }

    /// Confirms the complete state-command matrix emits lifecycle actions only for accepted transitions.
    func testStateCommandMatrixEmitsOnlyAcceptedLifecycleActions() throws {
        let entity = SpatialEntity("entity-motion-target")
        var messages: [EntityMotionStateChangedMessage] = []
        let animation = try EntityMotionAnimationObject(
            id: "animation-1",
            target: entity,
            timeline: timeline(),
            sendWebMsg: { _, message in
                if let state = message as? EntityMotionStateChangedMessage {
                    messages.append(state)
                }
            }
        )

        animation.pause()
        animation.stop()
        try animation.reset()
        try animation.finish()
        try animation.finish()
        animation.pause()
        animation.stop()
        let setValues = try animation.set(
            EntityMotionTransformPayload(
                position: nil,
                rotation: .init(x: nil, y: 45, z: nil),
                scale: nil
            )
        )
        try animation.play()
        try animation.play()
        animation.pause()
        animation.pause()
        XCTAssertThrowsError(
            try animation.set(
                EntityMotionTransformPayload(
                    position: .init(x: 2, y: nil, z: nil),
                    rotation: nil,
                    scale: nil
                )
            )
        )
        try animation.play()
        animation.stop()
        animation.stop()
        try animation.finish()

        XCTAssertEqual(
            messages.map(\.detail.callbackAction),
            [.reset, .complete, .start, nil, nil, .stop, .complete]
        )
        XCTAssertEqual(setValues.rotation.y, 45, accuracy: 1e-6)
        XCTAssertEqual(animation.playState, .finished)
        XCTAssertTrue(messages.allSatisfy { message in
            if message.detail.callbackAction == nil {
                return message.detail.values == nil
            }
            guard let values = message.detail.values else {
                return false
            }
            return values.position.x.isFinite
                && values.rotation.y.isFinite
                && values.scale.z.isFinite
        })
    }

    /// Confirms reset before the first play commits the configured start pose instead of the current pose.
    func testResetBeforeFirstPlayCommitsConfiguredStartPose() throws {
        let entity = SpatialEntity("entity-motion-target")
        entity.transform.translation = SIMD3<Float>(5, 0, 0)
        let animation = try EntityMotionAnimationObject(
            id: "animation-1",
            target: entity,
            timeline: timeline(
                tracks: [
                    track("position.x", [(0, 1), (1, 10)]),
                ]
            )
        )

        try animation.reset()

        XCTAssertEqual(animation.playState, .idle)
        XCTAssertEqual(entity.transform.translation.x, 1, accuracy: 1e-6)
        XCTAssertEqual(animation.confirmedValues.position.x, 1, accuracy: 1e-6)
    }

    /// Defers the baseline snapshot for an inactive update until a later command needs it.
    func testIdleUpdateResetUsesLatestNativeBaseline() throws {
        let entity = SpatialEntity("entity-motion-target")
        entity.transform.translation = SIMD3<Float>(0, 1, 0)
        var messages: [EntityMotionStateChangedMessage] = []
        let animation = try EntityMotionAnimationObject(
            id: "animation-1",
            target: entity,
            timeline: timeline(),
            sendWebMsg: { _, message in
                if let state = message as? EntityMotionStateChangedMessage {
                    messages.append(state)
                }
            }
        )
        let candidate = timeline(
            tracks: [
                track("position.x", [(0, 2), (1, 4)]),
            ]
        )

        let result = try animation.update(candidate)
        entity.transform.translation.y = 5
        try animation.reset()

        XCTAssertEqual(result.revision, 1)
        XCTAssertEqual(result.values.position.y, 1, accuracy: 1e-6)
        XCTAssertEqual(animation.timeline, candidate)
        XCTAssertEqual(animation.playState, .idle)
        XCTAssertEqual(entity.transform.translation.x, 2, accuracy: 1e-6)
        XCTAssertEqual(entity.transform.translation.y, 5, accuracy: 1e-6)
        XCTAssertEqual(messages.map(\.detail.callbackAction), [.reset])
    }

    /// Confirms a finished update stays inactive and defers its next baseline until play.
    func testFinishedUpdateDefersBaselineUntilFreshPlay() throws {
        let entity = SpatialEntity("entity-motion-target")
        entity.transform.translation = SIMD3<Float>(0, 1, 0)
        var messages: [EntityMotionStateChangedMessage] = []
        let animation = try EntityMotionAnimationObject(
            id: "animation-1",
            target: entity,
            timeline: timeline(),
            sendWebMsg: { _, message in
                if let state = message as? EntityMotionStateChangedMessage {
                    messages.append(state)
                }
            }
        )
        try animation.finish()
        let candidate = timeline(
            tracks: [
                track("position.x", [(0, 2), (1, 4)]),
            ]
        )

        let result = try animation.update(candidate)
        entity.transform.translation.y = 5

        XCTAssertEqual(result.revision, 1)
        XCTAssertEqual(animation.playState, .finished)
        XCTAssertEqual(messages.map(\.detail.callbackAction), [.complete])

        try animation.play()

        XCTAssertEqual(animation.playState, .running)
        XCTAssertEqual(animation.confirmedValues.position.x, 2, accuracy: 1e-6)
        XCTAssertEqual(animation.confirmedValues.position.y, 5, accuracy: 1e-6)
        XCTAssertEqual(messages.map(\.detail.callbackAction), [.complete, .start])
    }

    /// Retargets a running animation from the current pose with a new revision and start event.
    func testRunningUpdateRetargetsFromCurrentPoseAndPreservesConfiguredTimeline() throws {
        let entity = SpatialEntity("entity-motion-target")
        var messages: [EntityMotionStateChangedMessage] = []
        var order: [String] = []
        let animation = try EntityMotionAnimationObject(
            id: "animation-1",
            target: entity,
            timeline: timeline(),
            sendWebMsg: { _, message in
                if let state = message as? EntityMotionStateChangedMessage {
                    messages.append(state)
                    order.append("message-\(state.detail.revision)")
                }
            }
        )
        try animation.play()
        entity.transform.translation.x = 5
        let candidate = timeline(
            duration: 2,
            delay: 0.25,
            playbackRate: 1.5,
            tracks: [
                track(
                    "position.x",
                    [(0, 100), (1, 7), (2, 10)],
                    timing: .easeOut
                ),
            ]
        )

        let result = try animation.update(candidate)
        order.append("reply-\(result.revision)")

        XCTAssertEqual(result.revision, 1)
        XCTAssertEqual(result.values.position.x, 5, accuracy: 1e-6)
        XCTAssertEqual(animation.timeline, candidate)
        XCTAssertEqual(animation.playState, .running)
        XCTAssertFalse(entity.entityMotionAllowsExternalTransformWrite)
        XCTAssertEqual(messages.map(\.detail.revision), [0, 1])
        XCTAssertEqual(messages.map(\.detail.callbackAction), [.start, .start])
        XCTAssertEqual(order, ["message-0", "message-1", "reply-1"])
        XCTAssertEqual(
            try XCTUnwrap(messages.last?.detail.values?.position.x),
            5,
            accuracy: 1e-6
        )
    }

    /// Confirms completion from the replaced execution cannot finish the new run.
    func testRunningUpdateIgnoresStaleCompletionRevision() throws {
        let entity = SpatialEntity("entity-motion-target")
        var messages: [EntityMotionStateChangedMessage] = []
        let animation = try EntityMotionAnimationObject(
            id: "animation-1",
            target: entity,
            timeline: timeline(),
            sendWebMsg: { _, message in
                if let state = message as? EntityMotionStateChangedMessage {
                    messages.append(state)
                }
            }
        )
        try animation.play()
        let result = try animation.update(timeline(duration: 2))

        animation.completeNaturally(revision: 0)

        XCTAssertEqual(result.revision, 1)
        XCTAssertEqual(animation.playState, .running)
        XCTAssertFalse(entity.entityMotionAllowsExternalTransformWrite)
        XCTAssertEqual(messages.map(\.detail.callbackAction), [.start, .start])

        animation.completeNaturally(revision: 1)

        XCTAssertEqual(animation.playState, .finished)
        XCTAssertTrue(entity.entityMotionAllowsExternalTransformWrite)
        XCTAssertEqual(messages.map(\.detail.callbackAction), [.start, .start, .complete])
    }

    /// Keeps pause through an update and starts the prepared definition on the next play.
    func testPausedUpdatePreservesPauseUntilPlayStartsNewExecution() throws {
        let entity = SpatialEntity("entity-motion-target")
        var messages: [EntityMotionStateChangedMessage] = []
        let animation = try EntityMotionAnimationObject(
            id: "animation-1",
            target: entity,
            timeline: timeline(),
            sendWebMsg: { _, message in
                if let state = message as? EntityMotionStateChangedMessage {
                    messages.append(state)
                }
            }
        )
        try animation.play()
        animation.pause()
        entity.transform.translation.x = 3

        let result = try animation.update(timeline(duration: 2))

        XCTAssertEqual(result.revision, 1)
        XCTAssertEqual(result.values.position.x, 3, accuracy: 1e-6)
        XCTAssertEqual(animation.playState, .paused)
        XCTAssertEqual(messages.map(\.detail.callbackAction), [.start, nil])

        try animation.play()

        XCTAssertEqual(animation.playState, .running)
        XCTAssertEqual(messages.map(\.detail.callbackAction), [.start, nil, .start])
        XCTAssertEqual(messages.last?.detail.revision, 1)
        XCTAssertEqual(
            try XCTUnwrap(messages.last?.detail.values?.position.x),
            3,
            accuracy: 1e-6
        )
    }

    /// Ensures terminal transitions discard a paused retarget before later resume.
    func testTerminalTransitionsDiscardPreparedPausedPlayback() throws {
        for action in ["stop", "reset", "finish"] {
            let entity = SpatialEntity("entity-motion-target-\(action)")
            var messages: [EntityMotionStateChangedMessage] = []
            let animation = try EntityMotionAnimationObject(
                id: "animation-\(action)",
                target: entity,
                timeline: timeline(),
                sendWebMsg: { _, message in
                    if let state = message as? EntityMotionStateChangedMessage {
                        messages.append(state)
                    }
                }
            )

            try animation.play()
            animation.pause()
            entity.transform.translation.x = 3
            _ = try animation.update(timeline(duration: 2))

            switch action {
            case "stop":
                animation.stop()
            case "reset":
                try animation.reset()
            case "finish":
                try animation.finish()
            default:
                XCTFail("Unexpected terminal action: \(action)")
            }

            try animation.play()
            animation.pause()
            try animation.play()

            XCTAssertEqual(
                messages.filter { $0.detail.callbackAction == .start }.count,
                2,
                "\(action) must not leave a stale prepared playback"
            )
            XCTAssertEqual(animation.playState, .running)
        }
    }

    /// Leaves the old execution untouched when candidate preparation fails.
    func testUpdateFailureRollsBackTimelineRevisionStateAndWriteProtection() throws {
        let entity = SpatialEntity("entity-motion-target")
        let original = timeline()
        let animation = try EntityMotionAnimationObject(
            id: "animation-1",
            target: entity,
            timeline: original
        )
        try animation.play()

        XCTAssertThrowsError(try animation.update(timeline(duration: 0)))

        XCTAssertEqual(animation.timeline, original)
        XCTAssertEqual(animation.executionRevision, 0)
        XCTAssertEqual(animation.playState, .running)
        XCTAssertFalse(entity.entityMotionAllowsExternalTransformWrite)
    }

    /// Creates a minimal full-pose timeline for object behavior tests.
    private func timeline(
        duration: Double = 1,
        delay: Double = 0,
        playbackRate: Double = 1,
        loop: EntityMotionLoopPayload = .disabled,
        tracks: [EntityMotionTrackPayload]? = nil
    ) -> EntityMotionTimelinePayload {
        EntityMotionTimelinePayload(
            duration: duration,
            delay: delay,
            playbackRate: playbackRate,
            loop: loop,
            tracks: tracks ?? [
                track("position.x", [(0, 0), (duration, 1)]),
            ]
        )
    }

    /// Creates one scalar track from compact test tuples.
    private func track(
        _ property: String,
        _ frames: [(Double, Double)],
        timing: EntityMotionTimingFunction = .linear
    ) -> EntityMotionTrackPayload {
        EntityMotionTrackPayload(
            property: property,
            keyframes: frames.map {
                EntityMotionKeyframePayload(at: $0.0, value: $0.1, timingFunction: nil)
            },
            timingFunction: timing
        )
    }

    /// Creates a complete column-major translation matrix for external writes.
    private func translationMatrix(
        x: Float,
        y: Float = 0,
        z: Float = 0
    ) -> [String: Float] {
        [
            "0": 1, "1": 0, "2": 0, "3": 0,
            "4": 0, "5": 1, "6": 0, "7": 0,
            "8": 0, "9": 0, "10": 1, "11": 0,
            "12": x, "13": y, "14": z, "15": 1,
        ]
    }

    /// Asserts one callback message contains the target's complete current Transform.
    private func assertConfirmed(
        _ message: EntityMotionStateChangedMessage?,
        matches entity: SpatialEntity,
        action: EntityMotionCallbackAction,
        file: StaticString = #filePath,
        line: UInt = #line
    ) throws {
        let message = try XCTUnwrap(message, file: file, line: line)
        XCTAssertEqual(message.detail.callbackAction, action, file: file, line: line)
        let values = try XCTUnwrap(message.detail.values, file: file, line: line)
        try assertPayload(values, matches: entity, file: file, line: line)
    }

    /// Asserts all nine confirmation values match RealityKit's stored Transform.
    private func assertPayload(
        _ values: EntityMotionConfirmedTransformPayload,
        matches entity: SpatialEntity,
        file: StaticString = #filePath,
        line: UInt = #line
    ) throws {
        let pose = try EntityMotionTransformValues.decompose(entity.transform)
        XCTAssertEqual(values.position.x, pose.position.x, accuracy: 1e-8, file: file, line: line)
        XCTAssertEqual(values.position.y, pose.position.y, accuracy: 1e-8, file: file, line: line)
        XCTAssertEqual(values.position.z, pose.position.z, accuracy: 1e-8, file: file, line: line)
        XCTAssertEqual(values.rotation.x, pose.rotation.x, accuracy: 1e-5, file: file, line: line)
        XCTAssertEqual(values.rotation.y, pose.rotation.y, accuracy: 1e-5, file: file, line: line)
        XCTAssertEqual(values.rotation.z, pose.rotation.z, accuracy: 1e-5, file: file, line: line)
        XCTAssertEqual(values.scale.x, pose.scale.x, accuracy: 1e-8, file: file, line: line)
        XCTAssertEqual(values.scale.y, pose.scale.y, accuracy: 1e-8, file: file, line: line)
        XCTAssertEqual(values.scale.z, pose.scale.z, accuracy: 1e-8, file: file, line: line)
    }
}

private extension EntityMotionTimelinePayload {
    /// Returns a copy with selected top-level values replaced.
    func replacing(
        duration: Double? = nil,
        delay: Double? = nil,
        playbackRate: Double? = nil,
        tracks: [EntityMotionTrackPayload]? = nil
    ) -> Self {
        .init(
            duration: duration ?? self.duration,
            delay: delay ?? self.delay,
            playbackRate: playbackRate ?? self.playbackRate,
            loop: loop,
            tracks: tracks ?? self.tracks
        )
    }

    /// Returns a copy whose first track uses the supplied property and optional value.
    func replacing(property: String, value: Double? = nil) -> Self {
        var tracks = tracks
        let original = tracks[0]
        tracks[0] = .init(
            property: property,
            keyframes: original.keyframes.enumerated().map { index, frame in
                .init(
                    at: frame.at,
                    value: index == 0 ? value ?? frame.value : frame.value,
                    timingFunction: frame.timingFunction
                )
            },
            timingFunction: original.timingFunction
        )
        return replacing(tracks: tracks)
    }

    /// Returns a copy with one malformed first keyframe time.
    func replacingKeyframe(at: Double) -> Self {
        replacingFirstKeyframe(at: at, value: tracks[0].keyframes[0].value)
    }

    /// Returns a copy with one malformed first keyframe value.
    func replacingKeyframe(value: Double) -> Self {
        replacingFirstKeyframe(at: tracks[0].keyframes[0].at, value: value)
    }

    /// Returns a copy without a time-zero boundary.
    func removingStartBoundary() -> Self {
        replacingFirstKeyframe(at: 0.5, value: tracks[0].keyframes[0].value)
    }

    /// Returns a copy without a duration boundary.
    func removingEndBoundary() -> Self {
        var tracks = tracks
        let original = tracks[0]
        tracks[0] = .init(
            property: original.property,
            keyframes: Array(original.keyframes.dropLast()),
            timingFunction: original.timingFunction
        )
        return replacing(tracks: tracks)
    }

    /// Returns a copy with a replaced first keyframe.
    private func replacingFirstKeyframe(at: Double, value: Double) -> Self {
        var tracks = tracks
        let original = tracks[0]
        var keyframes = original.keyframes
        keyframes[0] = .init(
            at: at,
            value: value,
            timingFunction: keyframes[0].timingFunction
        )
        tracks[0] = .init(
            property: original.property,
            keyframes: keyframes,
            timingFunction: original.timingFunction
        )
        return replacing(tracks: tracks)
    }
}

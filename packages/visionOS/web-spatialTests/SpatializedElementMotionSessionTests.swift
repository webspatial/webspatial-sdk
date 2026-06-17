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
}

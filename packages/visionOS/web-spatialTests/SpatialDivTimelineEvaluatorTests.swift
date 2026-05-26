@testable import WebSpatial
import XCTest

final class SpatialDivTimelineEvaluatorTests: XCTestCase {
    func test_canonicalMultiTrackSamplesMatchWebEvaluator() {
        let timeline = SpatialDivMotionTimelinePayload(
            duration: 5,
            delay: nil,
            playbackRate: nil,
            loop: nil,
            tracks: [
                SpatialDivMotionTrackPayload(
                    property: "transform.translate.x",
                    keyframes: [
                        SpatialDivMotionKeyframePayload(at: 0, value: 0),
                        SpatialDivMotionKeyframePayload(at: 5, value: 100),
                    ],
                    easing: "linear"
                ),
                SpatialDivMotionTrackPayload(
                    property: "opacity",
                    keyframes: [
                        SpatialDivMotionKeyframePayload(at: 3, value: 0),
                        SpatialDivMotionKeyframePayload(at: 5, value: 1),
                    ],
                    easing: "easeOut"
                ),
            ]
        )

        let evaluator = SpatialDivTimelineEvaluator(
            timeline: timeline,
            baselineSRT: .identity,
            baselineOpacity: 1
        )

        let early = evaluator.sampleSRTAndOpacity(at: 1.5)
        XCTAssertEqual(early.srt.translateX, 30, accuracy: 0.5)
        XCTAssertEqual(early.opacity, 0, accuracy: 0.01)

        let final = evaluator.sampleSRTAndOpacity(at: 5)
        XCTAssertEqual(final.srt.translateX, 100, accuracy: 0.5)
        XCTAssertEqual(final.opacity, 1, accuracy: 0.01)
    }

    func test_translateZDepthTrackSamples() {
        let timeline = SpatialDivMotionTimelinePayload(
            duration: 4,
            delay: nil,
            playbackRate: nil,
            loop: nil,
            tracks: [
                SpatialDivMotionTrackPayload(
                    property: "transform.translate.z",
                    keyframes: [
                        SpatialDivMotionKeyframePayload(at: 0, value: 0),
                        SpatialDivMotionKeyframePayload(at: 4, value: -120),
                    ],
                    easing: "linear"
                ),
            ]
        )

        let evaluator = SpatialDivTimelineEvaluator(
            timeline: timeline,
            baselineSRT: .identity,
            baselineOpacity: 1
        )

        let mid = evaluator.sampleSRTAndOpacity(at: 2)
        XCTAssertEqual(mid.srt.translateZ, -60, accuracy: 0.5)

        let end = evaluator.sampleSRTAndOpacity(at: 4)
        XCTAssertEqual(end.srt.translateZ, -120, accuracy: 0.5)
    }

    func test_rotateYAndRotateZTracksSample() {
        let timeline = SpatialDivMotionTimelinePayload(
            duration: 4,
            delay: nil,
            playbackRate: nil,
            loop: nil,
            tracks: [
                SpatialDivMotionTrackPayload(
                    property: "transform.rotate.y",
                    keyframes: [
                        SpatialDivMotionKeyframePayload(at: 0, value: 0),
                        SpatialDivMotionKeyframePayload(at: 4, value: 90),
                    ],
                    easing: "linear"
                ),
                SpatialDivMotionTrackPayload(
                    property: "transform.rotate.z",
                    keyframes: [
                        SpatialDivMotionKeyframePayload(at: 1, value: 0),
                        SpatialDivMotionKeyframePayload(at: 4, value: 180),
                    ],
                    easing: "linear"
                ),
            ]
        )

        let evaluator = SpatialDivTimelineEvaluator(
            timeline: timeline,
            baselineSRT: .identity,
            baselineOpacity: 1
        )

        let t2 = evaluator.sampleSRTAndOpacity(at: 2)
        XCTAssertEqual(t2.srt.rotateY, 45, accuracy: 0.5)
        XCTAssertEqual(t2.srt.rotateZ, 60, accuracy: 0.5)

        let t3 = evaluator.sampleSRTAndOpacity(at: 3)
        XCTAssertEqual(t3.srt.rotateY, 67.5, accuracy: 0.5)
        XCTAssertEqual(t3.srt.rotateZ, 120, accuracy: 0.5)
    }
}

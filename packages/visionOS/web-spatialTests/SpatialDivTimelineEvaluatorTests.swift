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
}

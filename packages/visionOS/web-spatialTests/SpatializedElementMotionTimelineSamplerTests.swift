@testable import WebSpatial
import XCTest

final class SpatializedElementMotionTimelineSamplerTests: XCTestCase {
    func test_canonicalMultiTrackSamplesMatchWebEvaluator() {
        let timeline = SpatializedMotionTimelinePayload(
            duration: 5,
            delay: nil,
            playbackRate: nil,
            loop: nil,
            tracks: [
                SpatializedMotionTrackPayload(
                    property: "transform.translate.x",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 0, value: 0, timingFunction: "linear"),
                        SpatializedMotionKeyframePayload(at: 5, value: 100, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
                SpatializedMotionTrackPayload(
                    property: "opacity",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 3, value: 0, timingFunction: "easeOut"),
                        SpatializedMotionKeyframePayload(at: 5, value: 1, timingFunction: nil),
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

        let early = sampler.sampleTransformAndOpacity(at: 1.5)
        XCTAssertEqual(early.transform.translateX, 30, accuracy: 0.5)
        XCTAssertEqual(early.opacity, 0, accuracy: 0.01)

        let final = sampler.sampleTransformAndOpacity(at: 5)
        XCTAssertEqual(final.transform.translateX, 100, accuracy: 0.5)
        XCTAssertEqual(final.opacity, 1, accuracy: 0.01)
    }

    func test_translateZDepthTrackSamples() {
        let timeline = SpatializedMotionTimelinePayload(
            duration: 4,
            delay: nil,
            playbackRate: nil,
            loop: nil,
            tracks: [
                SpatializedMotionTrackPayload(
                    property: "transform.translate.z",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 0, value: 0, timingFunction: nil),
                        SpatializedMotionKeyframePayload(at: 4, value: -120, timingFunction: nil),
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

        let mid = sampler.sampleTransformAndOpacity(at: 2)
        XCTAssertEqual(mid.transform.translateZ, -60, accuracy: 0.5)

        let end = sampler.sampleTransformAndOpacity(at: 4)
        XCTAssertEqual(end.transform.translateZ, -120, accuracy: 0.5)
    }

    func test_rotateYAndRotateZTracksSample() {
        let timeline = SpatializedMotionTimelinePayload(
            duration: 4,
            delay: nil,
            playbackRate: nil,
            loop: nil,
            tracks: [
                SpatializedMotionTrackPayload(
                    property: "transform.rotate.y",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 0, value: 0, timingFunction: nil),
                        SpatializedMotionKeyframePayload(at: 4, value: 90, timingFunction: nil),
                    ],
                    timingFunction: "linear"
                ),
                SpatializedMotionTrackPayload(
                    property: "transform.rotate.z",
                    keyframes: [
                        SpatializedMotionKeyframePayload(at: 1, value: 0, timingFunction: nil),
                        SpatializedMotionKeyframePayload(at: 4, value: 180, timingFunction: nil),
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

        let t2 = sampler.sampleTransformAndOpacity(at: 2)
        XCTAssertEqual(t2.transform.rotateY, 45, accuracy: 0.5)
        XCTAssertEqual(t2.transform.rotateZ, 60, accuracy: 0.5)

        let t3 = sampler.sampleTransformAndOpacity(at: 3)
        XCTAssertEqual(t3.transform.rotateY, 67.5, accuracy: 0.5)
        XCTAssertEqual(t3.transform.rotateZ, 120, accuracy: 0.5)
    }
}

@testable import WebSpatial
import XCTest

final class SpatialScrollDragDeltaTests: XCTestCase {
    func test_horizontalDragProducesHorizontalScrollDelta() {
        let delta = spatialScrollDelta(
            from: CGSize(width: 40, height: 25),
            to: CGSize(width: 10, height: 25)
        )

        XCTAssertEqual(delta.x, 30)
        XCTAssertEqual(delta.y, 0)
    }

    func test_verticalDragBehaviorIsPreserved() {
        let delta = spatialScrollDelta(
            from: CGSize(width: 10, height: 40),
            to: CGSize(width: 10, height: 15)
        )

        XCTAssertEqual(delta.x, 0)
        XCTAssertEqual(delta.y, 25)
    }

    func test_diagonalDragProducesBothScrollDeltas() {
        let delta = spatialScrollDelta(
            from: CGSize(width: 50, height: 80),
            to: CGSize(width: 20, height: 35)
        )

        XCTAssertEqual(delta.x, 30)
        XCTAssertEqual(delta.y, 45)
    }
}

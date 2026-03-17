@testable import WebSpatial
import XCTest

final class NavigationCleanupTests: XCTestCase {
    func test_resetForNavigation_destroysSceneSpatialObjectsAndAttachments() {
        // Given: a scene with spatial objects and attachments created by the current page
        let scene = SpatialApp.Instance.createScene(
            "http://localhost:5173/",
            .window,
            .visible
        )

        let panel: Spatialized2DElement = scene.createSpatializedElement(.Spatialized2DElement)
        panel.setParent(scene)
        XCTAssertNotNil(scene.findSpatialObject(panel.id) as Spatialized2DElement?)

        _ = scene.attachmentManager.create(
            id: "test-attachment",
            parentEntityId: "test-parent-entity",
            position: SIMD3<Float>(0, 0, 0),
            size: CGSize(width: 100, height: 100)
        )
        XCTAssertFalse(scene.attachmentManager.attachments.isEmpty)

        // When: navigation happens (reload/back/forward/new URL)
        scene.resetForNavigation()

        // Then: all existing spatial objects and attachments should be cleaned up
        XCTAssertNil(scene.findSpatialObject(panel.id) as Spatialized2DElement?)
        XCTAssertTrue(scene.attachmentManager.attachments.isEmpty)
        XCTAssertNil(SpatialObject.get(panel.id))
    }
}

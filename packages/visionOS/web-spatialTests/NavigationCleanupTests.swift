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
            placementId: "test-parent-entity",
            position: SIMD3<Float>(0, 0, 0),
            rotation: SIMD3<Float>(0, 0, 0),
            scale: SIMD3<Float>(1, 1, 1),
            frameSize: CGSize(width: 100, height: 100),
            webViewModel: SpatialWebViewModel(
                url: "http://localhost:5173/",
                contentRole: .portal
            )
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

final class SpatialOpenWindowCommandTests: XCTestCase {
    func test_parsesLegacyWebSpatialCommands() throws {
        let commands: [SpatialOpenWindowCommand] = [
            .createSpatialScene,
            .createSpatialized2DElement,
            .createAttachment,
            .createOrnament,
        ]

        for command in commands {
            let url = try XCTUnwrap(URL(string: "webspatial://\(command.rawValue)?rid=req_1"))
            XCTAssertEqual(SpatialOpenWindowCommand(url: url), command)
        }
    }

    func test_parsesAboutBlankSpatialContentCommands() throws {
        let commands: [SpatialOpenWindowCommand] = [
            .createSpatialized2DElement,
            .createAttachment,
            .createOrnament,
        ]

        for command in commands {
            let url = try XCTUnwrap(URL(string: "about:blank?command=\(command.rawValue)&rid=req_2&wsepoch=9"))
            XCTAssertEqual(SpatialOpenWindowCommand(url: url), command)
        }
    }

    func test_prefersQueryCommandOverLegacyHost() throws {
        let url = try XCTUnwrap(URL(string: "webspatial://createOrnament?command=createAttachment"))
        XCTAssertEqual(SpatialOpenWindowCommand(url: url), .createAttachment)
    }

    func test_rejectsUnsupportedCommands() throws {
        let urls = [
            "about:blank",
            "about:blank?command=createSpatialScene",
            "about:blank?command=unknown",
            "https://example.com/?command=createOrnament",
        ]

        for value in urls {
            let url = try XCTUnwrap(URL(string: value))
            XCTAssertNil(SpatialOpenWindowCommand(url: url))
        }
    }
}

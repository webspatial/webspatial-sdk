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
            webViewModel: SpatialWebViewModel(url: "http://localhost:5173/")
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
final class SpatializedDynamic3DElementInspectTests: XCTestCase {
    func test_addAndRemoveEntityKeepsInspectHierarchyInSync() throws {
        let reality = SpatializedDynamic3DElement()
        let entity = SpatialEntity("Inspectable entity")
        entity.transform.translation = SIMD3<Float>(1, 2, 3)
        defer {
            if !entity.isDestroyed {
                entity.destroy()
            }
            if !reality.isDestroyed {
                reality.destroy()
            }
        }

        reality.addEntity(entity)

        XCTAssertEqual(reality.getRoot().spatialChildren[entity.spatialId], entity)

        let encoded = try JSONEncoder().encode(reality)
        let json = try XCTUnwrap(
            JSONSerialization.jsonObject(with: encoded) as? [String: Any]
        )
        let root = try XCTUnwrap(json["root"] as? [String: Any])
        let children = try XCTUnwrap(root["children"] as? [String: Any])
        let child = try XCTUnwrap(children[entity.spatialId] as? [String: Any])
        let position = try XCTUnwrap(child["position"] as? [String: Any])

        XCTAssertEqual(child["type"] as? String, "SpatialEntity")
        XCTAssertEqual(position["x"] as? Double, 1)
        XCTAssertEqual(position["y"] as? Double, 2)
        XCTAssertEqual(position["z"] as? Double, 3)

        reality.removeEntity(entity)

        XCTAssertNil(reality.getRoot().spatialChildren[entity.spatialId])
    }

    func test_reparentAndRemoveEntityKeepsInspectHierarchyInSync() {
        let reality = SpatializedDynamic3DElement()
        let firstParent = SpatialEntity("First parent")
        let secondParent = SpatialEntity("Second parent")
        let child = SpatialEntity("Child")
        defer {
            if !child.isDestroyed {
                child.destroy()
            }
            if !reality.isDestroyed {
                reality.destroy()
            }
        }

        reality.addEntity(firstParent)
        reality.addEntity(secondParent)
        firstParent.addChild(entity: child)
        secondParent.addChild(entity: child)

        XCTAssertNil(firstParent.spatialChildren[child.spatialId])
        XCTAssertEqual(secondParent.spatialChildren[child.spatialId], child)

        child.removeFromParent()

        XCTAssertNil(secondParent.spatialChildren[child.spatialId])
        XCTAssertNil(child.parent)
    }
}

final class SpatialSceneInspectTests: XCTestCase {
    func test_encodeIncludesOnlyActiveOrnaments() throws {
        let scene = SpatialApp.Instance.createScene(
            "http://localhost:5173/",
            .window,
            .visible
        )
        let detached = OrnamentElement(
            id: "detached-ornament",
            webViewModel: SpatialWebViewModel(url: nil),
            options: .default
        )
        let active = OrnamentElement(
            id: "active-ornament",
            webViewModel: SpatialWebViewModel(url: nil),
            options: .default
        )
        defer {
            if !scene.isDestroyed {
                scene.destroy()
            }
        }

        scene.ornamentManager.register(detached)
        scene.ornamentManager.register(active)
        XCTAssertTrue(scene.ornamentManager.add(id: active.id))

        let encoded = try JSONEncoder().encode(scene)
        let json = try XCTUnwrap(
            JSONSerialization.jsonObject(with: encoded) as? [String: Any]
        )
        let ornaments = try XCTUnwrap(json["ornaments"] as? [String: Any])

        XCTAssertNil(ornaments[detached.id])
        XCTAssertNotNil(ornaments[active.id])
    }
}

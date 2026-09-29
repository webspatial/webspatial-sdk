import RealityKit
import SwiftUI
@testable import WebSpatial
import XCTest

/// Exercises the same conversion functions called by native gesture callbacks.
/// The converter supplies known view geometry; Apple's real conversion methods
/// still perform the point/vector/quaternion conversions below.
@MainActor
final class SpatialGestureCoordinateTests: XCTestCase {
    private struct Converter: RealityCoordinateSpaceConverting {
        var localToScene = AffineTransform3D(scale: Size3D(width: 0.001, height: -0.001, depth: 0.001))

        func transform(from space: some CoordinateSpaceProtocol, to realitySpace: some RealityCoordinateSpace) -> AffineTransform3D {
            let parent = (realitySpace as? Entity)?.transformMatrix(relativeTo: nil) ?? matrix_identity_float4x4
            return AffineTransform3D(truncating: parent.inverse).concatenating(localToScene)
        }

        func transform(from realitySpace: some RealityCoordinateSpace, to space: some CoordinateSpaceProtocol) -> AffineTransform3D {
            transform(from: space, to: realitySpace).inverse!
        }
    }

    private func view(_ element: SpatializedElement) -> SpatializedElementView<EmptyView> {
        SpatializedElementView(parentScrollOffset: Vec2(x: 0, y: 0), spatializedElement: element) { EmptyView() }
    }

    private func assertPoint(_ actual: Point3D, _ expected: Point3D, file: StaticString = #filePath, line: UInt = #line) {
        XCTAssertEqual(actual.x, expected.x, accuracy: 1e-5, file: file, line: line)
        XCTAssertEqual(actual.y, expected.y, accuracy: 1e-5, file: file, line: line)
        XCTAssertEqual(actual.z, expected.z, accuracy: 1e-5, file: file, line: line)
    }

    private func assertRotation(_ actual: simd_quatd, _ expected: simd_quatd, file: StaticString = #filePath, line: UInt = #line) {
        XCTAssertEqual(abs(simd_dot(simd_normalize(actual).vector, simd_normalize(expected).vector)), 1, accuracy: 1e-5, file: file, line: line)
    }

    func testSpatialDivHitRemovesOwnTransformOriginAndDepth() {
        let element = SpatializedElement()
        defer { element.destroy() }
        element.width = 200
        element.height = 100
        element.rotationAnchor = UnitPoint3D(x: 0.25, y: 0.75, z: 0)
        element.backOffset = 30
        element.zIndex = 10
        element.proxySceneTransform = AffineTransform3D(translation: Vector3D(x: 10, y: 20, z: 0))
        element.transform = AffineTransform3D(
            scale: Size3D(width: 2, height: 3, depth: 1),
            rotation: Rotation3D(angle: .degrees(90), axis: .z),
            translation: Vector3D(x: 40, y: 50, z: 60)
        )
        // Local origin: subtract (50,75), scale, rotate, restore anchor,
        // then apply CSS translation, layout and depth.
        assertPoint(view(element).sceneToLocal(Point3D(x: 325, y: 45, z: 90.01), of: element), .zero)
    }

    func testSpatialDivCoordinateConversionIncludesCSSTransform() throws {
        let element = SpatializedElement()
        defer { element.destroy() }
        element.width = 200
        element.height = 100
        element.rotationAnchor = UnitPoint3D(x: 0.25, y: 0.75, z: 0)
        element.backOffset = 30
        element.zIndex = 10
        element.proxySceneTransform = AffineTransform3D(translation: Vector3D(x: 10, y: 20, z: 0))
        element.transform = AffineTransform3D(
            scale: Size3D(width: 2, height: 3, depth: 1),
            rotation: Rotation3D(angle: .degrees(90), axis: .z),
            translation: Vector3D(x: 40, y: 50, z: 60)
        )

        let local = SIMD3<Double>(20, 10, 5)
        let scene = element.convertToScene(local)
        let roundTrip = try XCTUnwrap(element.convertFromScene(scene))
        XCTAssertEqual(roundTrip.x, local.x, accuracy: 1e-5)
        XCTAssertEqual(roundTrip.y, local.y, accuracy: 1e-5)
        XCTAssertEqual(roundTrip.z, local.z, accuracy: 1e-5)
        assertPoint(
            view(element).sceneToLocal(Point3D(x: scene.x, y: scene.y, z: scene.z), of: element),
            Point3D(x: local.x, y: local.y, z: local.z)
        )
    }

    func testSpatialDivCoordinateConversionBetweenTransformedFrames() throws {
        let source = SpatializedElement()
        let target = SpatializedElement()
        defer { source.destroy(); target.destroy() }
        source.width = 120
        source.height = 80
        source.rotationAnchor = UnitPoint3D(x: 0.2, y: 0.7, z: 0)
        source.proxySceneTransform = AffineTransform3D(translation: Vector3D(x: 30, y: 50, z: 10))
        source.transform = AffineTransform3D(rotation: Rotation3D(angle: .degrees(35), axis: .z), translation: Vector3D(x: 15, y: -8, z: 20))
        target.width = 90
        target.height = 140
        target.rotationAnchor = UnitPoint3D(x: 0.8, y: 0.1, z: 0)
        target.proxySceneTransform = AffineTransform3D(translation: Vector3D(x: 260, y: 120, z: -15))
        target.transform = AffineTransform3D(scale: Size3D(width: 1.5, height: 0.75, depth: 2), rotation: Rotation3D(angle: .degrees(-20), axis: .y))

        let sourcePoint = SIMD3<Double>(25, 30, 4)
        let inTarget = try XCTUnwrap(source.convert(sourcePoint, to: target))
        let backInSource = try XCTUnwrap(target.convert(inTarget, to: source))
        XCTAssertEqual(backInSource.x, sourcePoint.x, accuracy: 1e-5)
        XCTAssertEqual(backInSource.y, sourcePoint.y, accuracy: 1e-5)
        XCTAssertEqual(backInSource.z, sourcePoint.z, accuracy: 1e-5)
    }

    func testSpatialDivCoordinateConversionRejectsSingularTarget() {
        let element = SpatializedElement()
        defer { element.destroy() }
        element.transform = AffineTransform3D(scale: Size3D(width: 0, height: 1, depth: 1))
        XCTAssertNil(element.convertFromScene(.zero))
    }

    func testRootDragIsCumulativeScenePixelsAndIgnoresTargetTransform() {
        let target = SpatializedElement()
        defer { target.destroy() }
        target.transform = AffineTransform3D(rotation: Rotation3D(angle: .degrees(60), axis: .y))
        let delta = view(target).parentSpaceTranslation(from: Point3D(x: 10, y: 20, z: 30), to: Point3D(x: 35, y: 10, z: 45))
        XCTAssertEqual(delta, Vector3D(x: 25, y: -10, z: 15))
    }

    func testNestedDragUsesRotatedScaledParentAxes() {
        let parent = Spatialized2DElement()
        let child = SpatializedElement()
        defer { child.destroy(); parent.destroy() }
        parent.rotationAnchor = .zero
        parent.transform = AffineTransform3D(scale: Size3D(width: 2, height: 3, depth: 4), rotation: Rotation3D(angle: .degrees(90), axis: .z))
        child.setParent(parent)
        child.transform = AffineTransform3D(rotation: Rotation3D(angle: .degrees(70), axis: .x))
        let delta = view(child).parentSpaceTranslation(from: Point3D(x: 100, y: 80, z: 60), to: Point3D(x: 70, y: 100, z: 80))
        XCTAssertEqual(delta.x, 10, accuracy: 1e-5)
        XCTAssertEqual(delta.y, 10, accuracy: 1e-5)
        XCTAssertEqual(delta.z, 5, accuracy: 1e-5)
    }

    func testSpatialDivRotationChangesBasisWithoutOwnRotationOrScale() throws {
        let target = SpatializedElement()
        defer { target.destroy() }
        target.proxySceneTransform = AffineTransform3D(rotation: Rotation3D(angle: .degrees(90), axis: .y))
        target.transform = AffineTransform3D(scale: Size3D(width: 2, height: 3, depth: 4), rotation: Rotation3D(angle: .degrees(45), axis: .x))
        let delta = Rotation3D(angle: .degrees(30), axis: .z)
        try assertRotation(XCTUnwrap(view(target).parentSpaceRotation(delta)), simd_quatd(angle: .pi / 6, axis: SIMD3(1, 0, 0)))
        try assertRotation(XCTUnwrap(view(target).parentSpaceRotation(.identity)), simd_quatd(angle: 0, axis: SIMD3(0, 1, 0)))
    }

    func testNestedRotationCancelsSharedScaledAncestors() throws {
        let parent = Spatialized2DElement()
        let child = SpatializedElement()
        defer { child.destroy(); parent.destroy() }
        parent.rotationAnchor = .zero
        parent.proxySceneTransform = AffineTransform3D(scale: Size3D(width: 2, height: 3, depth: 4), rotation: Rotation3D(angle: .degrees(25), axis: .y))
        parent.transform = AffineTransform3D(rotation: Rotation3D(angle: .degrees(60), axis: .z))
        child.setParent(parent)
        child.proxySceneTransform = parent.sceneTransform.concatenating(parent.transform)
        child.transform = AffineTransform3D(rotation: Rotation3D(angle: .degrees(50), axis: .x))
        let delta = Rotation3D(angle: .degrees(30), axis: .y)
        try assertRotation(XCTUnwrap(view(child).parentSpaceRotation(delta)), delta.quaternion)
    }

    func testSingularParentDoesNotEmitAnInvalidRotation() {
        let parent = Spatialized2DElement()
        let child = SpatializedElement()
        defer { child.destroy(); parent.destroy() }
        parent.transform = AffineTransform3D(scale: Size3D(width: 0, height: 1, depth: 1))
        child.setParent(parent)
        XCTAssertNil(view(child).parentSpaceRotation(.identity))
    }

    func testEntityHitIsTargetLocalMetersIncludingChildMesh() {
        let root = SpatializedDynamic3DElement()
        let target = SpatialEntity()
        let mesh = Entity()
        defer { target.destroy(); root.destroy() }
        target.position = SIMD3(0.2, 0.1, 0)
        target.scale = SIMD3(repeating: 2)
        target.orientation = simd_quatf(angle: .pi / 2, axis: SIMD3(0, 0, 1))
        target.addChild(mesh)
        let nativeView = SpatializedDynamic3DView(spatializedDynamic3DElement: root)
        XCTAssertTrue(nativeView.webTarget(for: mesh) === target)
        XCTAssertTrue(nativeView.webTarget(for: target) === target)
        XCTAssertNil(nativeView.webTarget(for: Entity()))
        // Local (0.05, 0, 0) -> scene (0.2, 0.2, 0) -> view (200,-200,0).
        assertPoint(nativeView.targetLocalPoint(Point3D(x: 200, y: -200, z: 0), converter: Converter(), target: target), Point3D(x: 0.05, y: 0, z: 0))
    }

    func testEntityDragUsesParentMetersAndIgnoresTargetTransform() {
        let root = SpatializedDynamic3DElement()
        let parent = Entity()
        let target = SpatialEntity()
        defer { target.destroy(); root.destroy() }
        parent.orientation = simd_quatf(angle: .pi / 2, axis: SIMD3(0, 0, 1))
        parent.scale = SIMD3(repeating: 2)
        parent.addChild(target)
        target.orientation = simd_quatf(angle: .pi / 4, axis: SIMD3(0, 1, 0))
        target.scale = SIMD3(repeating: 3)
        let delta = SpatializedDynamic3DView(spatializedDynamic3DElement: root).parentSpaceTranslation(
            from: .zero, to: Point3D(x: 0, y: -100, z: 0), converter: Converter(), target: target
        )
        XCTAssertEqual(delta.x, 0.05, accuracy: 1e-5)
        XCTAssertEqual(delta.y, 0, accuracy: 1e-5)
        XCTAssertEqual(delta.z, 0, accuracy: 1e-5)
    }

    func testEntityRotationUsesParentAxesAndIdentityStaysIdentity() {
        let root = SpatializedDynamic3DElement()
        let parent = Entity()
        let target = SpatialEntity()
        defer { target.destroy(); root.destroy() }
        parent.orientation = simd_quatf(angle: .pi / 2, axis: SIMD3(0, 1, 0))
        parent.addChild(target)
        target.orientation = simd_quatf(angle: .pi / 3, axis: SIMD3(1, 0, 0))
        let nativeView = SpatializedDynamic3DView(spatializedDynamic3DElement: root)
        let delta = nativeView.parentSpaceRotation(Rotation3D(angle: .degrees(30), axis: .z), converter: Converter(), target: target)
        // SwiftUI Y reflection reverses Z rotation; parent's inverse Y rotation
        // maps scene -Z into parent +X.
        assertRotation(Rotation3D(delta).quaternion, simd_quatd(angle: .pi / 6, axis: SIMD3(1, 0, 0)))
        assertRotation(Rotation3D(nativeView.parentSpaceRotation(.identity, converter: Converter(), target: target)).quaternion, simd_quatd(angle: 0, axis: SIMD3(1, 0, 0)))
    }

    func testUnparentedEntityFallsBackToSceneMeters() {
        let root = SpatializedDynamic3DElement()
        let target = SpatialEntity()
        defer { target.destroy(); root.destroy() }
        let nativeView = SpatializedDynamic3DView(spatializedDynamic3DElement: root)
        let delta = nativeView.parentSpaceTranslation(from: .zero, to: Point3D(x: 100, y: -200, z: 300), converter: Converter(), target: target)
        XCTAssertEqual(delta.x, 0.1, accuracy: 1e-5)
        XCTAssertEqual(delta.y, 0.2, accuracy: 1e-5)
        XCTAssertEqual(delta.z, 0.3, accuracy: 1e-5)
        assertRotation(Rotation3D(nativeView.parentSpaceRotation(Rotation3D(angle: .degrees(30), axis: .z), converter: Converter(), target: target)).quaternion, simd_quatd(angle: -.pi / 6, axis: SIMD3(0, 0, 1)))
    }

    func testEntityRotationIgnoresNonUniformParentScale() {
        let root = SpatializedDynamic3DElement()
        let parent = Entity()
        let target = SpatialEntity()
        defer { target.destroy(); root.destroy() }
        parent.orientation = simd_quatf(angle: .pi / 3, axis: SIMD3(0, 1, 0))
        parent.addChild(target)
        let nativeView = SpatializedDynamic3DView(spatializedDynamic3DElement: root)
        let rotation = Rotation3D(angle: .degrees(35), axis: RotationAxis3D(x: 1, y: 1, z: 1))
        let unscaled = nativeView.parentSpaceRotation(rotation, converter: Converter(), target: target)
        parent.scale = SIMD3(2, 3, 4)
        let scaled = nativeView.parentSpaceRotation(rotation, converter: Converter(), target: target)
        assertRotation(Rotation3D(scaled).quaternion, Rotation3D(unscaled).quaternion)
    }

    func testEntityRotationPreservesReflectedParentBasis() {
        let root = SpatializedDynamic3DElement()
        let parent = Entity()
        let target = SpatialEntity()
        defer { target.destroy(); root.destroy() }
        parent.addChild(target)
        let nativeView = SpatializedDynamic3DView(spatializedDynamic3DElement: root)
        let rotation = Rotation3D(angle: .degrees(30), axis: .z)

        parent.scale = SIMD3(2, 3, 4)
        let unreflected = nativeView.parentSpaceRotation(rotation, converter: Converter(), target: target)
        parent.scale = SIMD3(-2, 3, 4)
        let reflected = nativeView.parentSpaceRotation(rotation, converter: Converter(), target: target)

        assertRotation(Rotation3D(reflected).quaternion, Rotation3D(unreflected.inverse).quaternion)
    }

    func testEntityDragIncludesTransformedRealityView() {
        let root = SpatializedDynamic3DElement()
        let target = SpatialEntity()
        defer { target.destroy(); root.destroy() }
        let host = AffineTransform3D(rotation: Rotation3D(angle: .degrees(90), axis: .z), translation: Vector3D(x: 2, y: 3, z: 4))
        let converter = Converter(localToScene: host.concatenating(Converter().localToScene))
        let delta = SpatializedDynamic3DView(spatializedDynamic3DElement: root).parentSpaceTranslation(from: .zero, to: Point3D(x: 100, y: 0, z: 0), converter: converter, target: target)
        XCTAssertEqual(delta.x, 0, accuracy: 1e-5)
        XCTAssertEqual(delta.y, 0.1, accuracy: 1e-5)
        XCTAssertEqual(delta.z, 0, accuracy: 1e-5)
    }
}

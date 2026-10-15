import Foundation
@testable import WebSpatial
import XCTest

final class AttachmentSurfaceNormalizationTests: XCTestCase {
    /// A missing corner radius payload falls back to 0 for all four corners.
    func test_missingCornerRadiusFallsBackToZero() {
        let radius = AttachmentInfo.clampedCornerRadius(nil)
        XCTAssertEqual(radius, CornerRadius())
    }

    /// Valid radii pass through unchanged.
    func test_validCornerRadiusIsPreserved() {
        let radius = AttachmentInfo.clampedCornerRadius(
            CornerRadius(topLeading: 12, bottomLeading: 12, topTrailing: 12, bottomTrailing: 12)
        )
        XCTAssertEqual(radius.topLeading, 12)
        XCTAssertEqual(radius.bottomLeading, 12)
        XCTAssertEqual(radius.topTrailing, 12)
        XCTAssertEqual(radius.bottomTrailing, 12)
    }

    /// Negative and non-finite radii clamp to 0 without touching valid corners.
    func test_invalidCornerRadiusValuesClampToZero() {
        let radius = AttachmentInfo.clampedCornerRadius(
            CornerRadius(
                topLeading: -8,
                bottomLeading: .nan,
                topTrailing: .infinity,
                bottomTrailing: 24
            )
        )
        XCTAssertEqual(radius.topLeading, 0)
        XCTAssertEqual(radius.bottomLeading, 0)
        XCTAssertEqual(radius.topTrailing, 0)
        XCTAssertEqual(radius.bottomTrailing, 24)
    }

    /// A missing material falls back to transparent surface behavior.
    func test_missingBackgroundMaterialFallsBackToTransparent() {
        XCTAssertEqual(AttachmentInfo.effectiveBackgroundMaterial(nil), .Transparent)
    }

    /// A provided material passes through unchanged.
    func test_providedBackgroundMaterialIsPreserved() {
        XCTAssertEqual(AttachmentInfo.effectiveBackgroundMaterial(.GlassMaterial), .GlassMaterial)
    }

    /// Unknown raw material strings decode to .None, which shares the
    /// transparent (clip-only) rendering branch of the surface modifier.
    func test_unknownMaterialStringDecodesToNone() throws {
        let decoded = try JSONDecoder().decode(BackgroundMaterial.self, from: Data("\"frosted\"".utf8))
        XCTAssertEqual(decoded, .None)
    }

    /// Documented material strings decode to their matching cases.
    func test_documentedMaterialStringsDecode() throws {
        let pairs: [(String, BackgroundMaterial)] = [
            ("none", .None),
            ("transparent", .Transparent),
            ("translucent", .GlassMaterial),
            ("thin", .ThinMaterial),
            ("regular", .RegularMaterial),
            ("thick", .ThickMaterial),
        ]
        for (raw, expected) in pairs {
            let decoded = try JSONDecoder().decode(BackgroundMaterial.self, from: Data("\"\(raw)\"".utf8))
            XCTAssertEqual(decoded, expected, "Material \(raw) decoded unexpectedly")
        }
    }
}

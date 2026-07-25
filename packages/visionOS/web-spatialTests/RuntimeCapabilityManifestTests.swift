import WebKit
@testable import WebSpatial
import XCTest

final class RuntimeCapabilityManifestTests: XCTestCase {
    func test_manifestContainsBuildMetadataAndCurrentCapabilities() {
        let manifest = RuntimeCapabilityManifestProvider.manifestDictionary()
        let runtime = manifest["runtime"] as? [String: String]
        let supported = manifest["supported"] as? [String]

        XCTAssertEqual(manifest["manifestVersion"] as? Int, 1)
        XCTAssertEqual(runtime?["type"], "visionos")
        XCTAssertEqual(runtime?["version"], RuntimeCapabilityManifestProvider.packageVersion)
        XCTAssertEqual(runtime?["buildId"], "package-\(RuntimeCapabilityManifestProvider.packageVersion)")
        XCTAssertTrue(supported?.contains("Model") ?? false)
        XCTAssertTrue(supported?.contains("useAnimation:entity") ?? false)
    }

    func test_userScriptInjectsFrozenManifestAtDocumentStart() {
        let source = RuntimeCapabilityManifestProvider.injectionSource()
        let userScript = RuntimeCapabilityManifestProvider.makeUserScript()

        XCTAssertTrue(source.contains("__webspatialCapabilities"))
        XCTAssertTrue(source.contains("Object.freeze(manifest)"))
        XCTAssertTrue(source.contains("writable: false"))
        XCTAssertTrue(source.contains("const nativeOpen = globalThis.open"))
        XCTAssertTrue(source.contains("install(child)"))
        XCTAssertEqual(userScript.injectionTime, .atDocumentStart)
        XCTAssertFalse(userScript.isForMainFrameOnly)
    }
}

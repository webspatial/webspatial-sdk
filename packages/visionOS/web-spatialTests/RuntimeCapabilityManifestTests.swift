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
        XCTAssertEqual(runtime?["version"], pwaManager.getShellVersion())
        XCTAssertEqual(runtime?["buildId"], pwaManager.getRuntimeBuildId())
        XCTAssertTrue(supported?.contains("Model") ?? false)
        XCTAssertTrue(supported?.contains("useAnimation:entity") ?? false)
    }

    func test_userScriptInjectsFrozenManifestAtDocumentStart() {
        let source = RuntimeCapabilityManifestProvider.injectionSource()
        let userScript = RuntimeCapabilityManifestProvider.makeUserScript()

        XCTAssertTrue(source.contains("__webspatialCapabilities"))
        XCTAssertTrue(source.contains("Object.freeze(manifest)"))
        XCTAssertTrue(source.contains("writable: false"))
        XCTAssertFalse(source.contains("globalThis.open"))
        XCTAssertEqual(userScript.injectionTime, .atDocumentStart)
        XCTAssertFalse(userScript.isForMainFrameOnly)
    }

    func test_manifestIsInstalledOnlyForApplicationWebViews() {
        let applicationController = WKUserContentController()
        WKWebViewManager.Instance.installRuntimeCapabilityManifestIfNeeded(
            into: applicationController,
            contentRole: .application
        )

        let portalController = WKUserContentController()
        WKWebViewManager.Instance.installRuntimeCapabilityManifestIfNeeded(
            into: portalController,
            contentRole: .portal
        )

        XCTAssertTrue(containsRuntimeCapabilityManifest(applicationController))
        XCTAssertFalse(containsRuntimeCapabilityManifest(portalController))
    }

    private func containsRuntimeCapabilityManifest(
        _ controller: WKUserContentController
    ) -> Bool {
        controller.userScripts.contains {
            $0.source.contains("__webspatialCapabilities")
        }
    }
}

import RealityKit
import SwiftUI

@Observable
class SpatialTextureResource: SpatialObject {
    private(set) var url: String
    var _resource: TextureResource?
    var resource: TextureResource? {
        _resource
    }

    override init(_ url: String) {
        self.url = url
        super.init()
    }

    func load() async throws {
        let localURL = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<URL, Error>) in
            Dynamic3DManager.loadResourceToLocal(url) { result in
                continuation.resume(with: result)
            }
        }
        _resource = try await Task { @MainActor in
            try await TextureResource(contentsOf: localURL)
        }.value
    }

    func updateURL(_ newURL: String) async throws {
        url = newURL
        let localURL = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<URL, Error>) in
            Dynamic3DManager.loadResourceToLocal(url) { result in
                continuation.resume(with: result)
            }
        }
        _resource = try await Task { @MainActor in
            try await TextureResource(contentsOf: localURL)
        }.value
    }

    override func onDestroy() {
        _resource = nil
    }
}

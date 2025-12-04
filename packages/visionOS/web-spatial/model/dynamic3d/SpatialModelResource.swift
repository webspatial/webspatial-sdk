import RealityKit
import SwiftUI

@Observable
class SpatialModelResource: SpatialObject {
    var _resource: Entity? = nil
    var resource: Entity? {
        _resource
    }

    init(_ urlString: String, _ onload: @escaping (Result<SpatialModelResource, Error>) -> Void) {
        super.init()
        Dynamic3DManager.loadResourceToLocal(urlString) { result in
            switch result {
            case let .success(url):
                DispatchQueue.main.async {
                    do {
                        let entity = try Entity.load(contentsOf: url)
                        self._resource = entity
                        onload(.success(self))
                    } catch {
                        print("Failed to load entity from URL: \(error)")
                        onload(.failure(error))
                        self.destroy()
                    }
                }
            case let .failure(error):
                print("Failed to download model: \(error)")
                onload(.failure(error))
                self.destroy()
            }
        }
    }

    override func onDestroy() {
        _resource = nil
    }
}

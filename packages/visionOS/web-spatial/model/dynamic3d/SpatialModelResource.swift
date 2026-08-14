import RealityKit
import SwiftUI

/// Metadata for one animation clip embedded in a loaded model asset.
/// Serialized into the CreateModelAsset JSB reply.
struct AnimationClipInfo: Codable {
    /// Stable and unique within this loaded asset (e.g. `clip_0`).
    let id: String
    /// Authored clip name; nil when the importer did not preserve one.
    let name: String?
    /// Unscaled duration in seconds (0 when unavailable on this OS version).
    let duration: Double
}

@Observable
class SpatialModelResource: SpatialObject {
    var _resource: Entity?
    var resource: Entity? {
        _resource
    }

    /// Discovered animation clips, in deterministic traversal order.
    private(set) var clips: [AnimationClipInfo] = []

    init(_ urlString: String, _ onload: @escaping (Result<SpatialModelResource, Error>) -> Void) {
        super.init()
        Dynamic3DManager.loadResourceToLocal(urlString) { result in
            switch result {
            case let .success(url):
                DispatchQueue.main.async {
                    do {
                        let entity = try Entity.load(contentsOf: url)
                        self._resource = entity
                        self.clips = SpatialModelResource.extractAnimationClips(from: entity).clips
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

    /// Walks the entity hierarchy depth-first collecting `availableAnimations`,
    /// de-duplicated by resource identity. Ids are assigned by traversal order
    /// (`clip_0`, `clip_1`, …), so running the same extraction on a
    /// `clone(recursive: true)` of the hierarchy yields matching ids — which is
    /// how `SpatialModelEntity` resolves clip ids on its own cloned subtree.
    static func extractAnimationClips(from root: Entity)
        -> (clips: [AnimationClipInfo], resources: [String: (entity: Entity, animation: AnimationResource)])
    {
        var seen = Set<ObjectIdentifier>()
        var clips: [AnimationClipInfo] = []
        var resources: [String: (entity: Entity, animation: AnimationResource)] = [:]
        var index = 0
        func visit(_ entity: Entity) {
            for animation in entity.availableAnimations {
                let key = ObjectIdentifier(animation)
                if seen.contains(key) { continue }
                seen.insert(key)
                let id = "clip_\(index)"
                let name = animation.name?.isEmpty == false ? animation.name : nil
                var duration: Double = 0
                if #available(visionOS 2.0, *) {
                    // AnimationDefinition.duration requires visionOS 2. On
                    // older runtimes we report 0 and let the first playback
                    // state sample fill the real value in on the JS side.
                    duration = animation.definition.duration
                }
                clips.append(AnimationClipInfo(id: id, name: name, duration: duration))
                resources[id] = (entity: entity, animation: animation)
                index += 1
            }
            for child in entity.children { visit(child) }
        }
        visit(root)
        return (clips, resources)
    }

    override func onDestroy() {
        _resource = nil
        clips = []
    }
}

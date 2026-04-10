import Foundation
import RealityKit

enum GeometryCreationError: LocalizedError {
    case invalidType(String)
    case missingFields(String, [String])

    var errorDescription: String? {
        switch self {
        case let .invalidType(t):
            return "invalid geometry type: \(t)"
        case let .missingFields(type, fields):
            return "missing required fields for \(type): " + fields.joined(separator: ", ")
        }
    }
}

class Dynamic3DManager {
    static func createEntity(_ props: CreateSpatialEntity) -> SpatialEntity {
        let entity = SpatialEntity()
        entity.name = props.name ?? ""
        return entity
    }

    static func createModelComponent(mesh: Geometry, mats: [SpatialMaterial]) -> SpatialModelComponent {
        return SpatialModelComponent(mesh: mesh, mats: mats)
    }

    static func createGeometry(_ props: CreateGeometryProperties) throws -> Geometry {
        guard let type = GeometryType(rawValue: props.type) else {
            throw GeometryCreationError.invalidType(props.type)
        }
        switch type {
        case .BoxGeometry:
            var missing: [String] = []
            if props.width == nil { missing.append("width") }
            if props.height == nil { missing.append("height") }
            if props.depth == nil { missing.append("depth") }
            if !missing.isEmpty { throw GeometryCreationError.missingFields("BoxGeometry", missing) }
            return BoxGeometry(width: props.width!, height: props.height!, depth: props.depth!, cornerRadius: props.cornerRadius ?? 0, splitFaces: props.splitFaces ?? false)
        case .PlaneGeometry:
            var missing: [String] = []
            if props.width == nil { missing.append("width") }
            if props.height == nil { missing.append("height") }
            if !missing.isEmpty { throw GeometryCreationError.missingFields("PlaneGeometry", missing) }
            return PlaneGeometry(width: props.width!, height: props.height!, cornerRadius: props.cornerRadius ?? 0)
        case .SphereGeometry:
            var missing: [String] = []
            if props.radius == nil { missing.append("radius") }
            if !missing.isEmpty { throw GeometryCreationError.missingFields("SphereGeometry", missing) }
            return SphereGeometry(radius: props.radius!)
        case .ConeGeometry:
            var missing: [String] = []
            if props.radius == nil { missing.append("radius") }
            if props.height == nil { missing.append("height") }
            if !missing.isEmpty { throw GeometryCreationError.missingFields("ConeGeometry", missing) }
            return ConeGeometry(radius: props.radius!, height: props.height!)
        case .CylinderGeometry:
            var missing: [String] = []
            if props.radius == nil { missing.append("radius") }
            if props.height == nil { missing.append("height") }
            if !missing.isEmpty { throw GeometryCreationError.missingFields("CylinderGeometry", missing) }
            return CylinderGeometry(radius: props.radius!, height: props.height!)
        }
    }

    // Error messages are thrown from createGeometry using GeometryCreationError

    static func createUnlitMaterial(_ props: CreateUnlitMaterial, _ tex: TextureResource? = nil) -> SpatialUnlitMaterial {
        return SpatialUnlitMaterial(props.color ?? "#FFFFFF", tex, props.transparent ?? true, props.opacity ?? 1)
    }

    static func loadResourceToLocal(_ urlString: String, loadComplete: @escaping (Result<URL, Error>) -> Void) {
        // load local file
        if urlString.starts(with: "file://") {
            guard let localUrl = URL(string: pwaManager.getLocalResourceURL(url: urlString)) else {
                loadComplete(.failure(NSError(domain: "Download Error", code: 0, userInfo: [NSLocalizedDescriptionKey: "Local file is not found"])))
                return
            }
            loadComplete(.success(localUrl))
            return
        }
        // load net file
        guard let remoteURL = URL(string: urlString) else {
            loadComplete(.failure(NSError(domain: "Invalid URL", code: 0, userInfo: [NSLocalizedDescriptionKey: "Failed to create URL from string: \(urlString)"])))
            return
        }
        Task {
            do {
                let localURL = try await NativeAssetStore.shared.localFileURL(for: remoteURL)
                loadComplete(.success(localURL))
            } catch {
                loadComplete(.failure(error))
            }
        }
    }
}

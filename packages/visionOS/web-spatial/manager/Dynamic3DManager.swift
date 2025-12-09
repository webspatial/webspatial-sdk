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
        guard let url = URL(string: urlString) else {
            loadComplete(.failure(NSError(domain: "Invalid URL", code: 0, userInfo: [NSLocalizedDescriptionKey: "Failed to create URL from string: \(urlString)"])))
            return
        }
        var documentsUrl = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        documentsUrl.appendPathComponent(url.lastPathComponent)
        let session = URLSession(configuration: URLSessionConfiguration.default)
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        print("start load")
        let task = session.downloadTask(with: request, completionHandler: { location, response, error in
            if let error = error {
                loadComplete(.failure(error))
                return
            }
            if let httpResponse = response as? HTTPURLResponse, !(200 ... 299).contains(httpResponse.statusCode) {
                let error = NSError(domain: "HTTP Error", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "HTTP Error \(httpResponse.statusCode)"])
                loadComplete(.failure(error))
                return
            }
            guard let location = location else {
                loadComplete(.failure(NSError(domain: "Download Error", code: 0, userInfo: [NSLocalizedDescriptionKey: "Download location is nil"])))
                return
            }
            let fileManager = FileManager.default
            do {
                if fileManager.fileExists(atPath: documentsUrl.path) {
                    try fileManager.removeItem(atPath: documentsUrl.path)
                }
                try fileManager.moveItem(at: location, to: documentsUrl)
                print("load complete")
                loadComplete(.success(documentsUrl))
            } catch {
                print("File operation error: \(error)")
                loadComplete(.failure(error))
            }

        })
        task.resume()
    }
}

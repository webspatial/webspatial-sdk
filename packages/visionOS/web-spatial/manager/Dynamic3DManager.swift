import Foundation
import RealityKit

class Dynamic3DManager {
    static func createEntity(_ props: CreateSpatialEntity) -> SpatialEntity {
        let entity = SpatialEntity()
        entity.name = props.name ?? ""
        return entity
    }

    static func createModelComponent(mesh: Geometry, mats: [SpatialMaterial]) -> SpatialModelComponent {
        return SpatialModelComponent(mesh: mesh, mats: mats)
    }

    static func createGeometry(_ props: CreateGeometryProperties) -> Geometry? {
        guard let type = GeometryType(rawValue: props.type) else { return nil }
        var geometry: Geometry? = nil
        switch type {
        case .BoxGeometry:
            if let width = props.width, let height = props.height, let depth = props.depth {
                geometry = BoxGeometry(width: width, height: height, depth: depth, cornerRadius: props.cornerRadius ?? 0, splitFaces: props.splitFaces ?? false)
            }
        case .PlaneGeometry:
            if let width = props.width, let height = props.height {
                geometry = PlaneGeometry(width: width, height: height, cornerRadius: props.cornerRadius ?? 0)
            }
        case .SphereGeometry:
            if let radius = props.radius {
                geometry = SphereGeometry(radius: radius)
            }
        }
        return geometry
    }

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

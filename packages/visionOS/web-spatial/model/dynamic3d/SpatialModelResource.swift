import SwiftUI
import RealityKit

@Observable
class SpatialModelResource:SpatialObject {
    internal var _resource:Entity? = nil
    var resource:Entity? {
        _resource
    }
    
    init(_ urlString:String, _ onload: @escaping (Result<SpatialModelResource, Error>) -> Void){
        super.init()
        getDownloadModelUrl(urlString: urlString){ result in
            switch result {
            case .success(let url):
                DispatchQueue.main.async {
                    do {
                        let entity = try Entity.load(contentsOf: url)
                        self._resource = entity
                        onload(.success(self))
                    } catch {
                        print("Failed to load entity from URL: \(error)")
                        onload(.failure(error))
                    }
                }
            case .failure(let error):
                print("Failed to download model: \(error)")
                onload(.failure(error))
            }
        }
    }
    
    func getDownloadModelUrl(urlString:String, loadComplete:@escaping (Result<URL, Error>) -> Void) {
        guard let url = URL(string: urlString) else {
            loadComplete(.failure(NSError(domain: "Invalid URL", code: 0, userInfo: [NSLocalizedDescriptionKey: "Failed to create URL from string: \(urlString)"])))
            return
        }
        var documentsUrl = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        documentsUrl.appendPathComponent(url.lastPathComponent)
        let session = URLSession(configuration: URLSessionConfiguration.default)
        var request = URLRequest(url:url)
        request.httpMethod = "GET"
        print("start load")
        let task = session.downloadTask(with: request, completionHandler: { location, response, error in
            if let error = error {
                loadComplete(.failure(error))
                return
            }
            if let httpResponse = response as? HTTPURLResponse, !(200...299).contains(httpResponse.statusCode) {
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

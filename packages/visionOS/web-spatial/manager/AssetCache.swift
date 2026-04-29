import CryptoKit
import Foundation

enum AssetCacheError: LocalizedError {
    case invalidURL(String)
    case invalidLocalURL(String)
    case httpStatus(Int)

    var errorDescription: String? {
        switch self {
        case let .invalidURL(s):
            return "Failed to create URL from string: \(s)"
        case let .invalidLocalURL(s):
            return "Local file is not found: \(s)"
        case let .httpStatus(code):
            return "HTTP Error \(code)"
        }
    }
}

/// Disk-backed cache for remote 3D assets (models, textures).
///
/// Files are keyed by `sha256(absoluteURL)` and stored under
/// `Caches/AssetStore/<2-char-shard>/<hash>.<ext>`. Calls return the existing
/// local file when present; otherwise the asset is downloaded once and
/// atomically published via `FileManager.replaceItemAt`.
///
/// Responses carrying `Cache-Control: no-store` are honored: the downloaded
/// file is returned but never moved into the cache directory.
///
/// `file://` URLs are passed through to `pwaManager.getLocalResourceURL` and
/// are not cached.
actor AssetCache {
    static let shared = AssetCache()

    private let session: URLSession
    private let cacheRoot: URL
    private let fileManager = FileManager.default

    private init() {
        session = URLSession(configuration: .default)
        cacheRoot = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first!
            .appendingPathComponent("AssetStore", isDirectory: true)
    }

    func localFileURL(for urlString: String) async throws -> URL {
        if urlString.starts(with: "file://") {
            guard let localUrl = URL(string: pwaManager.getLocalResourceURL(url: urlString)) else {
                throw AssetCacheError.invalidLocalURL(urlString)
            }
            return localUrl
        }

        guard let url = URL(string: urlString) else {
            throw AssetCacheError.invalidURL(urlString)
        }

        let hash = Self.sha256Hex(url.absoluteString)
        let shard = String(hash.prefix(2))
        let ext = url.pathExtension.isEmpty ? "bin" : url.pathExtension
        let shardDir = cacheRoot.appendingPathComponent(shard, isDirectory: true)
        let cachePath = shardDir.appendingPathComponent("\(hash).\(ext)")

        if let attrs = try? fileManager.attributesOfItem(atPath: cachePath.path),
           let size = attrs[.size] as? NSNumber, size.intValue > 0
        {
            return cachePath
        }

        let (tempURL, response) = try await session.download(from: url)

        if let httpResponse = response as? HTTPURLResponse {
            guard (200 ... 299).contains(httpResponse.statusCode) else {
                throw AssetCacheError.httpStatus(httpResponse.statusCode)
            }
            if let cacheControl = httpResponse.value(forHTTPHeaderField: "Cache-Control"),
               cacheControl.lowercased().contains("no-store")
            {
                return tempURL
            }
        }

        try fileManager.createDirectory(at: shardDir, withIntermediateDirectories: true)

        let stagingURL = shardDir.appendingPathComponent("\(UUID().uuidString).tmp")
        try fileManager.moveItem(at: tempURL, to: stagingURL)

        if fileManager.fileExists(atPath: cachePath.path) {
            _ = try fileManager.replaceItemAt(cachePath, withItemAt: stagingURL)
        } else {
            try fileManager.moveItem(at: stagingURL, to: cachePath)
        }

        return cachePath
    }

    private static func sha256Hex(_ s: String) -> String {
        let digest = SHA256.hash(data: Data(s.utf8))
        return digest.map { String(format: "%02x", $0) }.joined()
    }
}

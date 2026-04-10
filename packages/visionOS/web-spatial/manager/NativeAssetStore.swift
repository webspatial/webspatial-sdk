import CryptoKit
import Foundation

/// App-scoped download cache with single-flight deduplication for remote assets.
actor NativeAssetStore {
    /// Instrumentation snapshot; all fields are monotonic counters updated only on this actor.
    struct Stats: Codable, Equatable, Sendable {
        /// Returned immediately from an on-disk cache entry (`fileExists` and size > 0).
        var cacheHits: Int
        /// Cache miss where the caller waited on an existing in-flight download for the same URL key.
        var missesJoinedInFlight: Int
        /// Cache miss where this caller started the single-flight download (first waiter for that key).
        var missesLeaderStarted: Int
        /// Completed network downloads that installed a file successfully (one per finished flight).
        var downloadsSucceeded: Int
        /// Completed network downloads that failed before a successful install (one per finished flight).
        var downloadsFailed: Int
    }

    /// Default maximum on-disk footprint for cached assets (512 MiB).
    private static let defaultByteCap: Int64 = 512 * 1024 * 1024

    static let shared = NativeAssetStore()

    private static let urlSession: URLSession = {
        let config = URLSessionConfiguration.default
        config.urlCache = URLCache(
            memoryCapacity: 50 * 1024 * 1024,
            diskCapacity: 200 * 1024 * 1024
        )
        config.requestCachePolicy = .useProtocolCachePolicy
        return URLSession(configuration: config)
    }()

    /// Keyed by URL content hash; each value is the list of waiters for one in-flight download.
    private var flightContinuations: [String: [CheckedContinuation<URL, Error>]] = [:]

    private var statsCacheHits = 0
    private var statsMissesJoinedInFlight = 0
    private var statsMissesLeaderStarted = 0
    private var statsDownloadsSucceeded = 0
    private var statsDownloadsFailed = 0

    func snapshot() -> Stats {
        Stats(
            cacheHits: statsCacheHits,
            missesJoinedInFlight: statsMissesJoinedInFlight,
            missesLeaderStarted: statsMissesLeaderStarted,
            downloadsSucceeded: statsDownloadsSucceeded,
            downloadsFailed: statsDownloadsFailed
        )
    }

    private init(byteCap: Int64 = defaultByteCap) {
        guard let root = Self.cachesRootURL() else {
            print("[NativeAssetStore] init skipped: could not resolve Caches directory")
            return
        }
        try? FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        print("[NativeAssetStore] initialized cache root=\(root.path) (eviction scan scheduled)")
        Task.detached(priority: .utility) {
            Self.runEvictionIfNeeded(root: root, byteCap: byteCap)
        }
    }

    func localFileURL(for remoteURL: URL) async throws -> URL {
        let cacheKey = Self.cacheKey(for: remoteURL)
        let finalURL = try Self.finalFileURL(cacheKey: cacheKey, remoteURL: remoteURL)

        if Self.isValidCachedFile(at: finalURL) {
            statsCacheHits += 1
            return finalURL
        }

        return try await withCheckedThrowingContinuation { continuation in
            if var existing = flightContinuations[cacheKey] {
                statsMissesJoinedInFlight += 1
                existing.append(continuation)
                flightContinuations[cacheKey] = existing
            } else {
                statsMissesLeaderStarted += 1
                flightContinuations[cacheKey] = [continuation]
                Task { await self.downloadAndReplace(remoteURL: remoteURL, cacheKey: cacheKey, finalURL: finalURL) }
            }
        }
    }

    private func downloadAndReplace(remoteURL: URL, cacheKey: String, finalURL: URL) async {
        do {
            let url = try await Self.performAtomicDownload(remoteURL: remoteURL, cacheKey: cacheKey, finalURL: finalURL)
            statsDownloadsSucceeded += 1
            completeFlight(cacheKey: cacheKey, result: .success(url))
        } catch {
            statsDownloadsFailed += 1
            completeFlight(cacheKey: cacheKey, result: .failure(error))
        }
    }

    private func completeFlight(cacheKey: String, result: Result<URL, Error>) {
        let waiters = flightContinuations.removeValue(forKey: cacheKey) ?? []
        for waiter in waiters {
            switch result {
            case let .success(url):
                waiter.resume(returning: url)
            case let .failure(error):
                waiter.resume(throwing: error)
            }
        }
    }

    private nonisolated static func cacheKey(for remoteURL: URL) -> String {
        let data = Data(remoteURL.absoluteString.utf8)
        let digest = SHA256.hash(data: data)
        return digest.map { String(format: "%02x", $0) }.joined()
    }

    private nonisolated static func cachesRootURL() -> URL? {
        guard let base = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first else {
            return nil
        }
        return base.appendingPathComponent("NativeAssets", isDirectory: true)
    }

    private nonisolated static func cachesRoot() throws -> URL {
        guard let url = cachesRootURL() else {
            throw NSError(
                domain: "NativeAssetStore",
                code: 1,
                userInfo: [NSLocalizedDescriptionKey: "Could not resolve caches directory"]
            )
        }
        return url
    }

    /// Scans the cache directory and removes oldest-by-modification-date files until usage is at or below ``byteCap``.
    ///
    /// Known edge case: eviction could theoretically delete a file that was just returned as a cache hit but not yet
    /// opened by ``Entity/load(contentsOf:)``. In practice, eviction targets the oldest files and active loads are newer.
    private nonisolated static func runEvictionIfNeeded(root: URL, byteCap: Int64) {
        let fm = FileManager.default
        guard let enumerator = fm.enumerator(
            at: root,
            includingPropertiesForKeys: [.isRegularFileKey, .fileSizeKey, .contentModificationDateKey],
            options: [.skipsHiddenFiles, .skipsPackageDescendants]
        ) else {
            print("[NativeAssetStore] eviction: could not enumerate cache at \(root.path)")
            return
        }

        struct Entry {
            let url: URL
            let size: Int64
            let modDate: Date
        }

        var entries: [Entry] = []
        for case let fileURL as URL in enumerator {
            if fileURL.pathExtension.caseInsensitiveCompare("tmp") == .orderedSame {
                continue
            }
            let keys: Set<URLResourceKey> = [.isRegularFileKey, .fileSizeKey, .contentModificationDateKey]
            guard let vals = try? fileURL.resourceValues(forKeys: keys),
                  vals.isRegularFile == true,
                  let size = vals.fileSize.map(Int64.init), size > 0,
                  let modDate = vals.contentModificationDate
            else {
                continue
            }
            entries.append(Entry(url: fileURL, size: size, modDate: modDate))
        }

        let totalFiles = entries.count
        let totalBytes = entries.reduce(Int64(0)) { $0 + $1.size }

        guard totalBytes > byteCap else {
            print(
                "[NativeAssetStore] eviction: totalFiles=\(totalFiles) totalBytes=\(totalBytes) filesEvicted=0 bytesFreed=0 (under cap)"
            )
            return
        }

        entries.sort { $0.modDate < $1.modDate }

        var remaining = totalBytes
        var filesEvicted = 0
        var bytesFreed: Int64 = 0

        for entry in entries {
            guard remaining > byteCap else { break }
            do {
                try fm.removeItem(at: entry.url)
                remaining -= entry.size
                bytesFreed += entry.size
                filesEvicted += 1
            } catch {
                continue
            }
        }

        print(
            "[NativeAssetStore] eviction: totalFiles=\(totalFiles) totalBytes=\(totalBytes) filesEvicted=\(filesEvicted) bytesFreed=\(bytesFreed)"
        )
    }

    private nonisolated static func shardDirectory(cacheKey: String) throws -> URL {
        let shard = String(cacheKey.prefix(2))
        return try cachesRoot().appendingPathComponent(shard, isDirectory: true)
    }

    private nonisolated static func finalFileURL(cacheKey: String, remoteURL: URL) throws -> URL {
        let ext = remoteURL.pathExtension
        let filename: String
        if ext.isEmpty {
            filename = cacheKey
        } else {
            filename = "\(cacheKey).\(ext)"
        }
        return try shardDirectory(cacheKey: cacheKey).appendingPathComponent(filename)
    }

    private nonisolated static func isValidCachedFile(at url: URL) -> Bool {
        let path = url.path
        guard FileManager.default.fileExists(atPath: path) else { return false }
        guard let attrs = try? FileManager.default.attributesOfItem(atPath: path),
              let size = attrs[.size] as? NSNumber
        else {
            return false
        }
        return size.int64Value > 0
    }

    private nonisolated static func performAtomicDownload(remoteURL: URL, cacheKey: String, finalURL: URL) async throws -> URL {
        let (systemTempURL, response) = try await urlSession.download(from: remoteURL)

        guard let http = response as? HTTPURLResponse else {
            try? FileManager.default.removeItem(at: systemTempURL)
            throw NSError(
                domain: "NativeAssetStore",
                code: 2,
                userInfo: [NSLocalizedDescriptionKey: "Non-HTTP response for \(remoteURL.absoluteString)"]
            )
        }
        guard (200 ... 299).contains(http.statusCode) else {
            try? FileManager.default.removeItem(at: systemTempURL)
            throw NSError(
                domain: "NativeAssetStore",
                code: http.statusCode,
                userInfo: [NSLocalizedDescriptionKey: "HTTP \(http.statusCode) for \(remoteURL.absoluteString)"]
            )
        }

        let shardDir = try shardDirectory(cacheKey: cacheKey)
        try FileManager.default.createDirectory(at: shardDir, withIntermediateDirectories: true)

        let tmpURL = shardDir.appendingPathComponent("\(UUID().uuidString).tmp", isDirectory: false)

        do {
            try FileManager.default.moveItem(at: systemTempURL, to: tmpURL)
        } catch {
            try? FileManager.default.removeItem(at: systemTempURL)
            throw error
        }

        do {
            _ = try FileManager.default.replaceItemAt(finalURL, withItemAt: tmpURL)
        } catch {
            try? FileManager.default.removeItem(at: tmpURL)
            throw error
        }

        return finalURL
    }
}

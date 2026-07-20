import Foundation

/// Reassembles the base64 chunks streamed from JS (see `blobTransfer.ts`) into a
/// local file that `Model3DAsset(url:)` can load.
///
/// Component-agnostic and JSB-agnostic: the owner feeds decoded-in-order chunks
/// and awaits `result()`. This type only tracks the running byte count against
/// the advertised size, enforces a per-chunk timeout, resolves the mime type to
/// a file extension, and renames the temp file on completion. The temp file is
/// removed on every failure path.
///
/// Ordering and single-in-flight-chunk delivery are guaranteed by the caller's
/// sequential acks, and every entry point runs on the main actor, so no locking
/// is needed.
final class BlobTransfer {
    enum TransferError: Error {
        case fetchFailed
        case sizeExceeded
        case unsupportedType(String?)
        case timedOut
        case cancelled
        case decodeFailed
        case io(Error)
    }

    /// mime -> file extension. The `<source type>` attribute takes precedence
    /// over the `Blob.type` reported on the first chunk.
    private static let mimeToExtension: [String: String] = [
        "model/vnd.usdz+zip": "usdz",
        "model/vnd.usd+zip": "usdz",
        "model/vnd.pixar.usd": "usd",
        "model/gltf-binary": "glb",
        "model/gltf+json": "gltf",
    ]

    private let sourceType: String?
    private let timeoutPerChunk: TimeInterval
    private let fileURL: URL
    private var handle: FileHandle?
    private var expectedSize: Int?
    private var byteCount = 0
    private var finished = false
    private var continuation: CheckedContinuation<URL, Error>?
    private var timeoutTask: Task<Void, Never>?

    /// - Parameter sourceType: the `<source type>` mime, preferred when resolving the extension.
    init(sourceType: String?, timeoutPerChunk: TimeInterval = 1.0) {
        self.sourceType = sourceType
        self.timeoutPerChunk = timeoutPerChunk
        fileURL = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString)
    }

    /// Awaits the fully reassembled file URL. Arms the per-chunk timeout.
    func result() async throws -> URL {
        try await withCheckedThrowingContinuation { continuation in
            guard !finished else {
                continuation.resume(throwing: TransferError.cancelled)
                return
            }
            self.continuation = continuation
            armTimeout()
        }
    }

    /// Feeds one chunk. `type`/`size` accompany every chunk; `isError` is set when
    /// JS failed to read the blob. Throws to tell the owner to ack-fail, which
    /// aborts the JS pump.
    func append(base64Data: String?, type: String?, size: Int?, isError: Bool) throws {
        guard !finished else { return }

        if isError {
            fail(.fetchFailed)
            throw TransferError.fetchFailed
        }
        if let size, expectedSize == nil {
            expectedSize = size
        }
        guard let base64Data, let bytes = Data(base64Encoded: base64Data) else {
            fail(.decodeFailed)
            throw TransferError.decodeFailed
        }

        do {
            try write(bytes, receivedType: type)
        } catch {
            let transferError = (error as? TransferError) ?? .io(error)
            fail(transferError)
            throw transferError
        }
    }

    /// Cancels an in-flight transfer (element reload/destroy) and cleans up.
    func cancel() {
        guard !finished else { return }
        fail(.cancelled)
    }

    // MARK: - Private

    private func write(_ bytes: Data, receivedType: String?) throws {
        if let expectedSize, byteCount + bytes.count > expectedSize {
            throw TransferError.sizeExceeded
        }

        let handle = try openHandle()
        do {
            try handle.write(contentsOf: bytes)
        } catch {
            throw TransferError.io(error)
        }
        byteCount += bytes.count
        armTimeout()

        if let expectedSize, byteCount >= expectedSize {
            try complete(receivedType: receivedType)
        }
    }

    private func openHandle() throws -> FileHandle {
        if let handle { return handle }
        FileManager.default.createFile(atPath: fileURL.path, contents: nil)
        let handle = try FileHandle(forWritingTo: fileURL)
        self.handle = handle
        return handle
    }

    private func complete(receivedType: String?) throws {
        guard let ext = fileExtension(receivedType: receivedType) else {
            throw TransferError.unsupportedType(sourceType ?? receivedType)
        }
        try? handle?.close()
        handle = nil

        let finalURL = fileURL.appendingPathExtension(ext)
        try? FileManager.default.removeItem(at: finalURL)
        do {
            try FileManager.default.moveItem(at: fileURL, to: finalURL)
        } catch {
            throw TransferError.io(error)
        }

        finished = true
        timeoutTask?.cancel()
        timeoutTask = nil
        continuation?.resume(returning: finalURL)
        continuation = nil
    }

    /// `<source type>` first, then the reported `Blob.type`.
    private func fileExtension(receivedType: String?) -> String? {
        for mime in [sourceType, receivedType] {
            if let ext = mime.flatMap({ Self.mimeToExtension[$0.lowercased()] }) {
                return ext
            }
        }
        return nil
    }

    private func armTimeout() {
        timeoutTask?.cancel()
        timeoutTask = Task { @MainActor [weak self, timeoutPerChunk] in
            try? await Task.sleep(for: .seconds(timeoutPerChunk))
            guard !Task.isCancelled else { return }
            self?.fail(.timedOut)
        }
    }

    private func fail(_ error: TransferError) {
        guard !finished else { return }
        finished = true
        timeoutTask?.cancel()
        timeoutTask = nil
        try? handle?.close()
        handle = nil
        try? FileManager.default.removeItem(at: fileURL)
        continuation?.resume(throwing: error)
        continuation = nil
    }
}

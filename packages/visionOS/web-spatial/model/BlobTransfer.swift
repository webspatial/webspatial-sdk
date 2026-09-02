import Foundation

/// Reassembles the chunks of a JavaScript `Blob` into a temporary file.
///
/// The web side drives `start`/`write`/`complete`, and each chunk is written to
/// disk as it arrives. `file()` suspends until the transfer succeeds or fails.
actor BlobTransfer {
    nonisolated let requestId: String

    private let source: ModelSource
    /// The file being assembled: `nil` before `start` and once the transfer ends.
    private var destination: Destination?
    private var receivedByteCount = 0
    /// Set exactly once, when the transfer ends.
    private var outcome: Result<URL, Error>?
    private var waiter: CheckedContinuation<URL, Error>?

    init(
        source: ModelSource,
        requestId: String = UUID().uuidString
    ) {
        self.source = source
        self.requestId = requestId
    }

    /// Waits for the web side to deliver the whole blob.
    /// The caller owns the returned temporary file and must remove it after use.
    func file() async throws -> URL {
        try await withTaskCancellationHandler {
            try await withCheckedThrowingContinuation { continuation in
                if let outcome {
                    continuation.resume(with: outcome)
                } else {
                    waiter = continuation
                }
            }
        } onCancel: {
            Task { await self.cancel() }
        }
    }

    func start(src: String, mimeType: String, size: Int) throws {
        guard src == source.src else {
            throw BlobTransferError("Blob source mismatch: expected \(source.src), received \(src)")
        }
        guard size >= 0 else {
            throw BlobTransferError("Blob size must not be negative: \(size)")
        }
        guard destination == nil, outcome == nil else {
            throw BlobTransferError("Blob transfer has already started")
        }

        let type = source.type ?? mimeType
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("BlobTransfer-\(UUID().uuidString)")
            .appendingPathExtension(ModelSource(src: source.src, type: type).fileExtension)
        guard FileManager.default.createFile(atPath: url.path, contents: nil),
              let handle = try? FileHandle(forWritingTo: url)
        else {
            try? FileManager.default.removeItem(at: url)
            throw BlobTransferError("Unable to create a temporary file for the blob")
        }

        destination = Destination(url: url, handle: handle, byteCount: size)
    }

    func write(offset: Int, base64Data: String) throws {
        let destination = try activeDestination()
        guard let data = Data(base64Encoded: base64Data) else {
            throw BlobTransferError("Blob chunk is not valid Base64 data")
        }
        guard offset >= 0, offset <= destination.byteCount,
              data.count <= destination.byteCount - offset
        else {
            throw BlobTransferError(
                "Blob chunk at offset \(offset) with \(data.count) bytes exceeds the expected file size of \(destination.byteCount)"
            )
        }

        try destination.handle.seek(toOffset: UInt64(offset))
        try destination.handle.write(contentsOf: data)
        receivedByteCount += data.count
    }

    func complete() throws {
        let destination = try activeDestination()
        guard receivedByteCount == destination.byteCount else {
            throw BlobTransferError("Expected \(destination.byteCount) blob bytes, received \(receivedByteCount)")
        }

        finish(.success(destination.url))
    }

    func cancel(reason: String? = nil) {
        finish(.failure(BlobTransferError(reason ?? "Blob transfer was cancelled")))
    }

    /// A live `destination` also means the transfer has not ended yet.
    private func activeDestination() throws -> Destination {
        guard let destination else {
            throw BlobTransferError("Blob transfer is not active")
        }
        return destination
    }

    /// Ends the transfer. Only the first call has an effect, so a late failure
    /// never discards a file that was already handed to the caller.
    private func finish(_ result: Result<URL, Error>) {
        guard outcome == nil else { return }
        outcome = result

        if let destination {
            try? destination.handle.close()
            if case .failure = result {
                try? FileManager.default.removeItem(at: destination.url)
            }
        }
        destination = nil
        waiter?.resume(with: result)
        waiter = nil
    }

    private struct Destination {
        let url: URL
        let handle: FileHandle
        let byteCount: Int
    }
}

/// Reported back to the web side as the failing command's error message.
struct BlobTransferError: LocalizedError {
    let errorDescription: String?

    init(_ message: String) {
        errorDescription = message
    }
}

import AsyncAlgorithms
import Foundation

private let tag = "BlobTransfer"

/// Reassembles the chunks of a JavaScript `Blob` into a temporary file.
actor BlobTransfer {
    nonisolated let requestId: String

    private let source: ModelSource
    private let chunks = AsyncChannel<Chunk>()

    private var metadata: Metadata?
    private var metadataContinuation: CheckedContinuation<Metadata, Error>?
    private var receivedByteCount = 0
    private var terminalError: Error?
    private var isFinished = false

    init(source: ModelSource, requestId: String = UUID().uuidString) {
        self.source = source
        self.requestId = requestId
    }

    /// Waits for transfer metadata, then writes chunks at their declared offsets.
    /// The caller owns the returned temporary file and must remove it after use.
    func file() async throws -> URL {
        let metadata = try await awaitMetadata()
        let type = source.type ?? metadata.mimeType
        let fileURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("\(tag)-\(requestId)")
            .appendingPathExtension(ModelSource(src: source.src, type: type).fileExtension)

        do {
            try Data().write(to: fileURL, options: .withoutOverwriting)
            let file = try FileHandle(forWritingTo: fileURL)
            defer { try? file.close() }

            for await chunk in chunks {
                try Task.checkCancellation()
                try file.seek(toOffset: UInt64(chunk.offset))
                try file.write(contentsOf: chunk.data)
            }

            if let terminalError {
                throw terminalError
            }
            try Task.checkCancellation()
            return fileURL
        } catch {
            try? FileManager.default.removeItem(at: fileURL)
            throw error
        }
    }

    func start(src: String, mimeType: String, size: Int) throws(BlobTransferError) {
        guard src == source.src else { throw .sourceMismatch(expected: source.src, actual: src) }
        guard size >= 0 else { throw .negativeSize(size) }
        guard metadata == nil, !isFinished else { throw .alreadyStarted }

        let metadata = Metadata(mimeType: mimeType, byteCount: size)
        self.metadata = metadata
        metadataContinuation?.resume(returning: metadata)
        metadataContinuation = nil
    }

    func write(offset: Int, base64Data: String) async throws {
        guard let metadata, !isFinished else {
            throw BlobTransferError.notActive
        }
        guard let data = Data(base64Encoded: base64Data) else {
            throw BlobTransferError.invalidBase64
        }
        guard offset >= 0, offset <= metadata.byteCount,
              data.count <= metadata.byteCount - offset
        else {
            throw BlobTransferError.chunkOutOfBounds(
                offset: offset,
                byteCount: data.count,
                expectedByteCount: metadata.byteCount
            )
        }

        receivedByteCount += data.count
        await chunks.send(Chunk(offset: offset, data: data))

        if let terminalError {
            throw terminalError
        }
        guard !isFinished else {
            throw BlobTransferError.notActive
        }
    }

    func complete() throws {
        guard let metadata, !isFinished else {
            throw BlobTransferError.notActive
        }
        guard receivedByteCount == metadata.byteCount else {
            throw BlobTransferError.byteCountMismatch(
                expected: metadata.byteCount,
                received: receivedByteCount
            )
        }

        isFinished = true
        chunks.finish()
    }

    func cancel(reason: String? = nil) {
        finish(throwing: BlobTransferError.cancelled(reason))
    }

    private func awaitMetadata() async throws -> Metadata {
        if let metadata {
            return metadata
        }
        if let terminalError {
            throw terminalError
        }

        return try await withTaskCancellationHandler {
            try await withCheckedThrowingContinuation { continuation in
                if let metadata {
                    continuation.resume(returning: metadata)
                } else if let terminalError {
                    continuation.resume(throwing: terminalError)
                } else {
                    metadataContinuation = continuation
                }
            }
        } onCancel: {
            Task { await self.cancel() }
        }
    }

    private func finish(throwing error: Error) {
        guard !isFinished else { return }
        isFinished = true
        terminalError = error
        metadataContinuation?.resume(throwing: error)
        metadataContinuation = nil
        chunks.finish()
    }
}

private extension BlobTransfer {
    struct Metadata {
        let mimeType: String
        let byteCount: Int
    }
}

private struct Chunk {
    let offset: Int
    let data: Data
}

enum BlobTransferError: Error {
    case sourceMismatch(expected: String, actual: String)
    case negativeSize(Int)
    case alreadyStarted
    case notActive
    case invalidBase64
    case chunkOutOfBounds(offset: Int, byteCount: Int, expectedByteCount: Int)
    case byteCountMismatch(expected: Int, received: Int)
    case cancelled(String?)
}

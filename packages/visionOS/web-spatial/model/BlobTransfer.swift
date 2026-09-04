import AsyncAlgorithms
import Foundation

private let tag = "BlobTransfer"

/// Reassembles the chunks of a JavaScript `Blob` into a temporary file.
actor BlobTransfer {
    nonisolated let requestId: String

    private let source: ModelSource
    private let chunks = AsyncThrowingChannel<Chunk, Error>()

    private var metadata: Metadata?
    private var receivedByteCount = 0
    private var isFinished = false

    init(source: ModelSource, requestId: String = UUID().uuidString) {
        self.source = source
        self.requestId = requestId
    }

    /// Waits for the transfer start chunk, then writes chunks at their declared offsets.
    /// The caller owns the returned temporary file and must remove it after use.
    func file() async throws -> URL {
        var iterator = chunks.makeAsyncIterator()
        guard let firstChunk = try await iterator.next() else {
            throw BlobTransferError.notActive
        }
        let type: String
        switch firstChunk {
        case let .start(mimeType, _):
            type = source.type ?? mimeType
        case .data:
            throw BlobTransferError.notActive
        }
        let fileURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("\(tag)-\(requestId)")
            .appendingPathExtension(ModelSource(src: source.src, type: type).fileExtension)

        do {
            try Data().write(to: fileURL, options: .withoutOverwriting)
            let file = try FileHandle(forWritingTo: fileURL)
            defer { try? file.close() }

            while let chunk = try await iterator.next() {
                try Task.checkCancellation()
                switch chunk {
                case .start:
                    throw BlobTransferError.alreadyStarted
                case let .data(offset, data):
                    try file.seek(toOffset: UInt64(offset))
                    try file.write(contentsOf: data)
                }
            }

            try Task.checkCancellation()
            return fileURL
        } catch {
            try? FileManager.default.removeItem(at: fileURL)
            throw error
        }
    }

    func start(src: String, mimeType: String, size: Int) async throws(BlobTransferError) {
        guard src == source.src else { throw .sourceMismatch(expected: source.src, actual: src) }
        guard size >= 0 else { throw .negativeSize(size) }
        guard metadata == nil, !isFinished else { throw .alreadyStarted }
        metadata = Metadata(mimeType: mimeType, byteCount: size)
        await chunks.send(.start(mimeType: mimeType, size: size))
    }

    func write(offset: Int, base64Data: String) async throws(BlobTransferError) {
        guard let metadata, !isFinished else { throw .notActive }
        guard let data = Data(base64Encoded: base64Data) else { throw .invalidBase64 }
        guard offset >= 0, offset <= metadata.byteCount, data.count <= metadata.byteCount - offset
        else { throw .chunkOutOfBounds(offset: offset, byteCount: data.count, size: metadata.byteCount) }

        receivedByteCount += data.count
        await chunks.send(.data(offset: offset, data: data))
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

    private func finish(throwing error: Error) {
        guard !isFinished else { return }
        isFinished = true
        chunks.fail(error)
    }
}

private extension BlobTransfer {
    struct Metadata {
        let mimeType: String
        let byteCount: Int
    }
}

private enum Chunk {
    case start(mimeType: String, size: Int)
    case data(offset: Int, data: Data)
}

enum BlobTransferError: Error {
    case sourceMismatch(expected: String, actual: String)
    case negativeSize(Int)
    case alreadyStarted
    case notActive
    case invalidBase64
    case chunkOutOfBounds(offset: Int, byteCount: Int, size: Int)
    case byteCountMismatch(expected: Int, received: Int)
    case cancelled(String?)
}

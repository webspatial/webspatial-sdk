import AsyncAlgorithms
import Foundation

private let tag = "BlobTransfer"
private let timeout = Duration.seconds(1)

/// Reassembles the chunks of a JavaScript `Blob` into a temporary file.
actor BlobTransfer {
    nonisolated let requestId = UUID().uuidString
    private let source: ModelSource
    private var expectedByteCount = 0
    private var receivedByteCount = 0
    private let chunks = AsyncThrowingChannel<Chunk, Error>()

    init(source: ModelSource) {
        self.source = source
    }

    /// Waits for the transfer start chunk, then writes chunks at their declared offsets.
    /// The caller owns the returned temporary file and must remove it after use.
    func file() async throws -> URL {
        var url: URL?
        do {
            guard case let .start(mimeType, _) = try await nextChunk() else {
                throw BlobTransferError.notActive
            }
            let fileExt = ModelSource(src: source.src, type: source.type ?? mimeType).fileExtension
            let fileURL = FileManager.default.temporaryDirectory
                .appendingPathComponent("\(tag)-\(requestId)")
                .appendingPathExtension(fileExt)
            url = fileURL
            try Data().write(to: fileURL, options: .withoutOverwriting)
            let file = try FileHandle(forWritingTo: fileURL)
            defer { try? file.close() }
            while case let .data(offset, data) = try await nextChunk() {
                try Task.checkCancellation()
                try file.seek(toOffset: offset)
                try file.write(contentsOf: data)
            }
            try Task.checkCancellation()
            return fileURL
        } catch {
            chunks.fail(error)
            if let url {
                try? FileManager.default.removeItem(at: url)
            }
            throw error
        }
    }

    func start(src: String, mimeType: String, size: Int) async throws(BlobTransferError) {
        guard src == source.src else { throw .sourceMismatch(expected: source.src, actual: src) }
        guard size >= 0 else { throw .negativeSize(size) }
        expectedByteCount = size
        await chunks.send(.start(mimeType: mimeType, size: size))
    }

    func write(offset: Int, base64Data: String) async throws(BlobTransferError) {
        guard let data = Data(base64Encoded: base64Data) else { throw .invalidBase64 }
        guard offset >= 0, offset <= expectedByteCount, data.count <= expectedByteCount - offset
        else { throw .chunkOutOfBounds(offset: offset, expectedByteCount: expectedByteCount) }
        receivedByteCount += data.count
        await chunks.send(.data(offset: UInt64(offset), data: data))
    }

    func complete() throws(BlobTransferError) {
        guard receivedByteCount == expectedByteCount else {
            throw .byteCountMismatch(expected: expectedByteCount, received: receivedByteCount)
        }
        chunks.finish()
    }

    nonisolated func cancel(reason: String? = nil) {
        chunks.fail(BlobTransferError.cancelled(reason))
    }

    private func nextChunk() async throws -> Chunk? {
        try await withTimeout(timeout) { [chunks] in
            var iterator = chunks.makeAsyncIterator()
            let chunk = try await iterator.next()
            try Task.checkCancellation()
            return chunk
        }
    }
}

private enum Chunk {
    case start(mimeType: String, size: Int)
    case data(offset: UInt64, data: Data)
}

enum BlobTransferError: Error {
    case sourceMismatch(expected: String, actual: String)
    case negativeSize(Int)
    case notActive
    case invalidBase64
    case chunkOutOfBounds(offset: Int, expectedByteCount: Int)
    case byteCountMismatch(expected: Int, received: Int)
    case cancelled(String?)
}

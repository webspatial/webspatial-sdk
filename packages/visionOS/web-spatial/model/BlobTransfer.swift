import AsyncAlgorithms
import Foundation

/// Reassembles the chunks of a JavaScript `Blob` into a temporary file.
actor BlobTransfer {
    nonisolated let requestId: String

    private let source: ModelSource
    private let timeout: Duration
    private let chunks = AsyncChannel<Chunk>()

    private var metadata: Metadata?
    private var metadataContinuation: CheckedContinuation<Metadata, Error>?
    private var receivedByteCount = 0
    private var terminalError: Error?
    private var isFinished = false
    private var timeoutTask: Task<Void, Never>?
    private var timeoutGeneration = 0

    init(
        source: ModelSource,
        requestId: String = UUID().uuidString,
        timeout: Duration = .seconds(1)
    ) {
        self.source = source
        self.requestId = requestId
        self.timeout = timeout
    }

    /// Waits for transfer metadata, then writes chunks at their declared offsets.
    /// The caller owns the returned temporary file and must remove it after use.
    func file() async throws -> URL {
        let metadata = try await awaitMetadata()
        let fileURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("BlobTransfer-\(UUID().uuidString)")
            .appendingPathExtension(source.fileExtension(mimeType: source.type ?? metadata.mimeType))

        do {
            try Data().write(to: fileURL, options: .withoutOverwriting)
            let file = try FileHandle(forWritingTo: fileURL)
            defer { try? file.close() }

            armTimeout()
            for await chunk in chunks {
                try Task.checkCancellation()
                try file.seek(toOffset: UInt64(chunk.offset))
                try file.write(contentsOf: chunk.data)
                armTimeout()
            }
            disarmTimeout()

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

    func start(src: String, mimeType: String, size: Int) throws {
        guard src == source.src else {
            throw BlobTransferError.sourceMismatch(expected: source.src, actual: src)
        }
        guard size >= 0 else {
            throw BlobTransferError.negativeSize(size)
        }
        guard metadata == nil, !isFinished else {
            throw BlobTransferError.alreadyStarted
        }

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
        disarmTimeout()
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

        armTimeout()
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

    private func armTimeout() {
        timeoutGeneration += 1
        let generation = timeoutGeneration
        timeoutTask?.cancel()
        timeoutTask = Task { [weak self, timeout] in
            do {
                try await Task.sleep(for: timeout)
                await self?.timeOut(generation: generation)
            } catch {}
        }
    }

    private func disarmTimeout() {
        timeoutGeneration += 1
        timeoutTask?.cancel()
        timeoutTask = nil
    }

    private func timeOut(generation: Int) {
        guard generation == timeoutGeneration, !isFinished else { return }
        finish(throwing: BlobTransferError.timedOut)
    }

    private func finish(throwing error: Error) {
        guard !isFinished else { return }
        isFinished = true
        terminalError = error
        disarmTimeout()
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

    struct Chunk {
        let offset: Int
        let data: Data
    }
}

enum BlobTransferError: LocalizedError, Equatable {
    case sourceMismatch(expected: String, actual: String)
    case negativeSize(Int)
    case alreadyStarted
    case notActive
    case invalidBase64
    case chunkOutOfBounds(offset: Int, byteCount: Int, expectedByteCount: Int)
    case byteCountMismatch(expected: Int, received: Int)
    case cancelled(String?)
    case timedOut

    var errorDescription: String? {
        switch self {
        case let .sourceMismatch(expected, actual):
            "Blob source mismatch: expected \(expected), received \(actual)"
        case let .negativeSize(size):
            "Blob size must not be negative: \(size)"
        case .alreadyStarted:
            "Blob transfer has already started"
        case .notActive:
            "Blob transfer is not active"
        case .invalidBase64:
            "Blob chunk is not valid Base64 data"
        case let .chunkOutOfBounds(offset, byteCount, expectedByteCount):
            "Blob chunk at offset \(offset) with \(byteCount) bytes exceeds the expected file size of \(expectedByteCount)"
        case let .byteCountMismatch(expected, received):
            "Expected \(expected) blob bytes, received \(received)"
        case let .cancelled(reason):
            reason ?? "Blob transfer was cancelled"
        case .timedOut:
            "Blob transfer timed out while waiting for data"
        }
    }
}

extension ModelSource {
    func fileExtension(mimeType: String?) -> String {
        let typeExtension: String? = switch mimeType {
        case "model/gltf+json": "gltf"
        case "model/gltf-binary": "glb"
        case "model/obj": "obj"
        case "model/stl": "stl"
        case "model/vnd.usda": "usda"
        case "model/vnd.usdz+zip": "usdz"
        default: nil
        }

        if let typeExtension {
            return typeExtension
        }
        if let sourceExtension = URL(string: src)?.pathExtension, !sourceExtension.isEmpty {
            return sourceExtension
        }
        return "usdz"
    }
}

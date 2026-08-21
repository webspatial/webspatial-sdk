import Foundation

/// Reassembles base64 chunks streamed from JS into a local temporary file.
///
/// Component-agnostic and JSB-agnostic: the owner controls request routing and
/// feeds lifecycle operations into this actor. Base64 decoding, random-access
/// seeks, and writes are serialized by the actor away from the main actor.
actor BlobTransfer {
    struct CompletedTransfer {
        let fileURL: URL
        let src: String
        let mimeType: String
        let size: Int
    }

    enum TransferError: Error {
        case invalidState
        case sourceMismatch
        case invalidChunk
        case explicitFailure(String?)
        case timedOut
        case cancelled
        case decodeFailed
        case io(Error)
    }

    private let expectedSrc: String
    private let inactivityTimeout: TimeInterval
    private let fileURL: URL
    private var handle: FileHandle?
    private var mimeType: String?
    private var size: Int?
    private var receivedByteCount = 0
    private var started = false
    private var finished = false
    private var continuation: CheckedContinuation<CompletedTransfer, Error>?
    private var finalResult: Result<CompletedTransfer, Error>?
    private var timeoutTask: Task<Void, Never>?

    init(expectedSrc: String, inactivityTimeout: TimeInterval = 1.0) {
        self.expectedSrc = expectedSrc
        self.inactivityTimeout = inactivityTimeout
        fileURL = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString)
    }

    /// Awaits explicit completion, failure, cancellation, or inactivity timeout.
    func result() async throws -> CompletedTransfer {
        if let finalResult {
            return try finalResult.get()
        }
        return try await withCheckedThrowingContinuation { continuation in
            guard self.continuation == nil else {
                continuation.resume(throwing: TransferError.invalidState)
                return
            }
            self.continuation = continuation
            armTimeout()
        }
    }

    /// Starts the request and creates its empty temporary file.
    func start(src: String, mimeType: String, size: Int) throws {
        guard !started, !finished, size >= 0 else {
            throw TransferError.invalidState
        }
        guard src == expectedSrc else {
            throw TransferError.sourceMismatch
        }

        do {
            _ = FileManager.default.createFile(atPath: fileURL.path, contents: nil)
            handle = try FileHandle(forWritingTo: fileURL)
        } catch {
            let transferError = TransferError.io(error)
            finishFailure(transferError)
            throw transferError
        }

        self.mimeType = mimeType
        self.size = size
        started = true
        armTimeout()
    }

    /// Decodes and writes a chunk at its supplied byte offset.
    func write(offset: Int, base64Data: String) throws {
        guard started, !finished, let handle, let size else {
            throw TransferError.invalidState
        }
        guard offset >= 0, let bytes = Data(base64Encoded: base64Data) else {
            let error = offset < 0 ? TransferError.invalidChunk : TransferError.decodeFailed
            finishFailure(error)
            throw error
        }
        guard offset <= size, bytes.count <= size - offset else {
            let error = TransferError.invalidChunk
            finishFailure(error)
            throw error
        }

        do {
            try handle.seek(toOffset: UInt64(offset))
            try handle.write(contentsOf: bytes)
        } catch {
            let transferError = TransferError.io(error)
            finishFailure(transferError)
            throw transferError
        }

        receivedByteCount += bytes.count
        armTimeout()
    }

    /// Closes and returns the assembled file after all advertised bytes arrive.
    @discardableResult
    func complete() throws -> CompletedTransfer {
        guard started, !finished, let mimeType, let size,
              receivedByteCount == size
        else {
            throw TransferError.invalidState
        }

        do {
            try handle?.close()
            handle = nil
        } catch {
            let transferError = TransferError.io(error)
            finishFailure(transferError)
            throw transferError
        }

        let completed = CompletedTransfer(
            fileURL: fileURL,
            src: expectedSrc,
            mimeType: mimeType,
            size: size
        )
        finished = true
        timeoutTask?.cancel()
        timeoutTask = nil
        finalResult = .success(completed)
        continuation?.resume(returning: completed)
        continuation = nil
        return completed
    }

    /// Records an explicit JS-side fetch, read, or bridge failure.
    func fail(message: String?) throws {
        guard !finished else { throw TransferError.invalidState }
        finishFailure(.explicitFailure(message))
    }

    /// Invalidates an in-flight request and removes its incomplete file.
    func cancel() {
        guard !finished else { return }
        finishFailure(.cancelled)
    }

    private func armTimeout() {
        timeoutTask?.cancel()
        let timeout = inactivityTimeout
        timeoutTask = Task { [weak self] in
            try? await Task.sleep(for: .seconds(timeout))
            guard !Task.isCancelled else { return }
            await self?.timeOut()
        }
    }

    private func timeOut() {
        guard !finished else { return }
        finishFailure(.timedOut)
    }

    private func finishFailure(_ error: TransferError) {
        guard !finished else { return }
        finished = true
        timeoutTask?.cancel()
        timeoutTask = nil
        try? handle?.close()
        handle = nil
        try? FileManager.default.removeItem(at: fileURL)
        finalResult = .failure(error)
        continuation?.resume(throwing: error)
        continuation = nil
    }
}

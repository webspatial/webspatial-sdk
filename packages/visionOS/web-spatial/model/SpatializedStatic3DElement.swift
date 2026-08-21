import Foundation
import SwiftUI

struct ModelSource: Codable, Equatable {
    let src: String
    let type: String?
}

enum Loading: String {
    case eager
    case lazy

    init(stringValue value: String) {
        self = Loading(rawValue: value) ?? .eager
    }
}

enum StageMode: String {
    case none
    case orbit

    init(stringValue value: String) {
        self = StageMode(rawValue: value) ?? .none
    }
}

@Observable
class SpatializedStatic3DElement: SpatializedElement {
    var modelURL: String?
    var sources: [ModelSource] = []
    var entityTransform: AffineTransform3D = .identity
    var autoplay: Bool = false
    var loop: Bool = false
    var animationPaused: Bool = true
    var playbackRate: Double = 1.0
    /// Requested seek position in seconds. Setting it triggers a seek in
    /// `SpatializedStatic3DView`, which clears it back to `nil`.
    var pendingSeekTime: Double?
    var posterURL: String?
    var loading: Loading = .eager
    var stagemode: StageMode = .none
    var allSources: [ModelSource] {
        if let modelURL { [ModelSource(src: modelURL, type: nil)] + sources }
        else { sources }
    }

    override var enableGesture: Bool {
        stagemode == .orbit || super.enableGesture
    }

    /// In-flight blob transfers keyed by the native-generated request ID.
    @ObservationIgnored private var activeTransfers: [String: BlobTransfer] = [:]
    /// Temp files produced by completed transfers, deleted on replacement or destroy.
    @ObservationIgnored private var tempFileURLs: Set<URL> = []

    /// Ships a `blob:` source's bytes from JS into a local file and returns its
    /// URL. `sourceType` is the `<source type>` mime, preferred over `Blob.type`
    /// when selecting the extension. Cancellation invalidates this request.
    func fetchBlob(src: String, sourceType: String?, scene: SpatialScene) async throws -> URL {
        let requestId = UUID().uuidString
        let transfer = BlobTransfer(expectedSrc: src)
        activeTransfers[requestId] = transfer
        defer {
            if activeTransfers[requestId] === transfer {
                activeTransfers[requestId] = nil
            }
        }

        scene.sendWebMsg(id, ModelBlobRequestEvent(
            detail: ModelBlobRequestDetail(requestId: requestId, src: src)
        ))

        let completed = try await withTaskCancellationHandler {
            try await transfer.result()
        } onCancel: {
            Task { await transfer.cancel() }
        }

        guard !Task.isCancelled, activeTransfers[requestId] === transfer else {
            try? FileManager.default.removeItem(at: completed.fileURL)
            throw BlobTransfer.TransferError.cancelled
        }

        do {
            let finalURL = try installCompletedBlob(completed, sourceType: sourceType)
            tempFileURLs.insert(finalURL)
            return finalURL
        } catch {
            try? FileManager.default.removeItem(at: completed.fileURL)
            throw error
        }
    }

    func startBlobTransfer(_ command: StartBlobTransfer) async throws {
        guard let transfer = activeTransfers[command.requestId] else {
            throw BlobTransfer.TransferError.cancelled
        }
        try await transfer.start(
            src: command.src,
            mimeType: command.mimeType,
            size: command.size
        )
    }

    func receiveBlobChunk(_ command: TransferBlobChunk) async throws {
        guard let transfer = activeTransfers[command.requestId] else {
            throw BlobTransfer.TransferError.cancelled
        }
        try await transfer.write(offset: command.offset, base64Data: command.data)
    }

    func completeBlobTransfer(_ command: CompleteBlobTransfer) async throws {
        guard let transfer = activeTransfers[command.requestId] else {
            throw BlobTransfer.TransferError.cancelled
        }
        try await transfer.complete()
    }

    func failBlobTransfer(_ command: FailBlobTransfer) async throws {
        guard let transfer = activeTransfers[command.requestId] else {
            throw BlobTransfer.TransferError.cancelled
        }
        try await transfer.fail(message: command.message)
    }

    /// Invalidates active requests before source replacement and removes files
    /// retained for the previous source set.
    func cancelBlobTransfersAndCleanup() {
        let transfers = Array(activeTransfers.values)
        activeTransfers.removeAll()
        for url in tempFileURLs {
            try? FileManager.default.removeItem(at: url)
        }
        tempFileURLs.removeAll()
        Task {
            for transfer in transfers {
                await transfer.cancel()
            }
        }
    }

    static func blobFileExtension(sourceType: String?, blobType: String) -> String {
        let mimeToExtension: [String: String] = [
            "model/vnd.usdz+zip": "usdz",
            "model/vnd.usd+zip": "usdz",
            "model/vnd.pixar.usd": "usd",
            "model/gltf-binary": "glb",
            "model/gltf+json": "gltf",
        ]
        for type in [sourceType, blobType] {
            let mime = type?
                .split(separator: ";", maxSplits: 1)
                .first?
                .trimmingCharacters(in: .whitespacesAndNewlines)
                .lowercased()
            if let mime, let ext = mimeToExtension[mime] {
                return ext
            }
        }
        return "usdz"
    }

    private func installCompletedBlob(
        _ completed: BlobTransfer.CompletedTransfer,
        sourceType: String?
    ) throws -> URL {
        let ext = Self.blobFileExtension(
            sourceType: sourceType,
            blobType: completed.mimeType
        )
        let finalURL = completed.fileURL.appendingPathExtension(ext)
        do {
            try FileManager.default.moveItem(at: completed.fileURL, to: finalURL)
            return finalURL
        } catch {
            throw BlobTransfer.TransferError.io(error)
        }
    }

    override func onDestroy() {
        cancelBlobTransfersAndCleanup()
        super.onDestroy()
    }

    enum CodingKeys: String, CodingKey {
        case modelURL, type
    }

    override func encode(to encoder: Encoder) throws {
        try super.encode(to: encoder)
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(modelURL, forKey: .modelURL)
        try container.encode(SpatializedElementType.SpatializedStatic3DElement, forKey: .type)
    }
}

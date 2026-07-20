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

    /// In-flight blob transfers keyed by source URL (the element loads one blob
    /// at a time, so `src` uniquely identifies the transfer). See `BlobTransfer`.
    @ObservationIgnored private var activeTransfers: [String: BlobTransfer] = [:]
    /// Temp files produced by completed transfers, deleted on destroy.
    @ObservationIgnored private var tempFileURLs: Set<URL> = []

    /// Ships a `blob:` source's bytes from JS into a local file and returns its
    /// URL. Sends the `modelblobrequest`, then awaits reassembly of the streamed
    /// chunks. `sourceType` is the `<source type>` mime, preferred when resolving
    /// the file extension. Cancellation (element reload) aborts the transfer.
    func fetchBlob(src: String, sourceType: String?, scene: SpatialScene) async throws -> URL {
        let transfer = BlobTransfer(sourceType: sourceType)
        activeTransfers[src] = transfer
        // Only clear our own entry: a same-src reload may already have replaced it.
        defer { if activeTransfers[src] === transfer { activeTransfers[src] = nil } }

        scene.sendWebMsg(id, ModelBlobRequestEvent(
            detail: ModelBlobRequestDetail(src: src)
        ))

        return try await withTaskCancellationHandler {
            let url = try await transfer.result()
            tempFileURLs.insert(url)
            return url
        } onCancel: {
            Task { @MainActor in transfer.cancel() }
        }
    }

    /// Feeds an incoming `TransferModelBlobData` chunk to its transfer. Throws
    /// when the chunk should be nacked (unknown source, decode/size/type error),
    /// which tells JS to abort the stream.
    func receiveBlobChunk(_ command: TransferModelBlobData) throws {
        guard let transfer = activeTransfers[command.src] else {
            throw BlobTransfer.TransferError.cancelled
        }
        try transfer.append(
            base64Data: command.data,
            type: command.type,
            size: command.size,
            isError: command.isError ?? false
        )
    }

    override func onDestroy() {
        for transfer in activeTransfers.values {
            transfer.cancel()
        }
        activeTransfers.removeAll()
        for url in tempFileURLs {
            try? FileManager.default.removeItem(at: url)
        }
        tempFileURLs.removeAll()
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

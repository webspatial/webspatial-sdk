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

    @ObservationIgnored private(set) var blobTransfer: BlobTransfer?
    override var enableGesture: Bool {
        stagemode == .orbit || super.enableGesture
    }

    func fetchBlob(_ source: ModelSource, from scene: SpatialScene) async throws -> URL {
        let transfer = BlobTransfer(source: source)
        let previousTransfer = blobTransfer
        blobTransfer = transfer
        if let previousTransfer {
            await previousTransfer.cancel()
        }
        defer { if blobTransfer === transfer { blobTransfer = nil } }
        scene.sendWebMsg(id, ModelBlobRequestEvent(requestId: transfer.requestId, src: source.src))

        do {
            return try await transfer.file()
        } catch {
            await transfer.cancel()
            throw error
        }
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

    override func onDestroy() {
        if let blobTransfer {
            self.blobTransfer = nil
            Task { await blobTransfer.cancel() }
        }
        super.onDestroy()
    }
}

import Foundation
import SwiftUI

enum OrnamentVisibility: String, Codable {
    case visible
    case hidden
}

struct OrnamentOptions: Codable, Equatable {
    var attachmentAnchor: String
    var contentAlignment: String
    var visibility: OrnamentVisibility
    var width: Double
    var height: Double
    var cornerRadius: CornerRadius
    var backgroundMaterial: BackgroundMaterial

    static let `default` = OrnamentOptions(
        attachmentAnchor: "bottom",
        contentAlignment: "back",
        visibility: .visible,
        width: 200,
        height: 150,
        cornerRadius: .init(),
        backgroundMaterial: .None
    )

    static func from(url: URL) -> OrnamentOptions {
        OrnamentOptions(
            attachmentAnchor: normalizeAttachmentAnchor(queryValue("attachmentAnchor", from: url)),
            contentAlignment: normalizeContentAlignment(queryValue("contentAlignment", from: url)),
            visibility: normalizeVisibility(queryValue("visibility", from: url)),
            width: normalizeSize(queryValue("width", from: url), fallback: OrnamentOptions.default.width),
            height: normalizeSize(queryValue("height", from: url), fallback: OrnamentOptions.default.height),
            cornerRadius: normalizeCornerRadius(decodeCornerRadius(queryValue("cornerRadius", from: url))),
            backgroundMaterial: normalizeBackgroundMaterial(queryValue("backgroundMaterial", from: url))
        )
    }

    static func normalized(
        attachmentAnchor: String?,
        contentAlignment: String?,
        visibility: String?,
        width: Double?,
        height: Double?,
        cornerRadius: CornerRadius?,
        backgroundMaterial: BackgroundMaterial?,
        previous: OrnamentOptions = .default
    ) -> OrnamentOptions {
        OrnamentOptions(
            attachmentAnchor: normalizeAttachmentAnchor(attachmentAnchor ?? previous.attachmentAnchor),
            contentAlignment: normalizeContentAlignment(contentAlignment ?? previous.contentAlignment),
            visibility: normalizeVisibility(visibility ?? previous.visibility.rawValue),
            width: width.flatMap { $0 > 0 ? $0 : nil } ?? previous.width,
            height: height.flatMap { $0 > 0 ? $0 : nil } ?? previous.height,
            cornerRadius: normalizeCornerRadius(cornerRadius ?? previous.cornerRadius),
            backgroundMaterial: backgroundMaterial ?? previous.backgroundMaterial
        )
    }

    private static func queryValue(_ name: String, from url: URL) -> String? {
        URLComponents(url: url, resolvingAgainstBaseURL: false)?
            .queryItems?
            .first { $0.name == name }?
            .value
    }

    private static func isValidPoint(_ value: String) -> Bool {
        switch value {
        case "topLeadingFront", "topLeading", "topLeadingBack",
             "topFront", "top", "topBack",
             "topTrailingFront", "topTrailing", "topTrailingBack",
             "leadingFront", "leading", "leadingBack",
             "front", "center", "back",
             "trailingFront", "trailing", "trailingBack",
             "bottomLeadingFront", "bottomLeading", "bottomLeadingBack",
             "bottomFront", "bottom", "bottomBack",
             "bottomTrailingFront", "bottomTrailing", "bottomTrailingBack":
            return true
        default:
            return false
        }
    }

    private static func normalizeAttachmentAnchor(_ value: String?) -> String {
        guard let value, isValidPoint(value) else { return "bottom" }
        if value == "topFront" || value == "top" || value == "topBack" {
            return "bottom"
        }
        return value
    }

    private static func normalizeContentAlignment(_ value: String?) -> String {
        guard let value, isValidPoint(value) else { return "back" }
        return value
    }

    private static func normalizeVisibility(_ value: String?) -> OrnamentVisibility {
        value == "hidden" ? .hidden : .visible
    }

    private static func normalizeSize(_ value: String?, fallback: Double) -> Double {
        guard let value, let number = Double(value), number > 0 else {
            return fallback
        }
        return number
    }

    private static func normalizeBackgroundMaterial(_ value: String?) -> BackgroundMaterial {
        guard let value, let material = BackgroundMaterial(rawValue: value) else {
            return OrnamentOptions.default.backgroundMaterial
        }
        return material
    }

    private static func normalizeCornerRadius(_ value: CornerRadius?) -> CornerRadius {
        let value = value ?? OrnamentOptions.default.cornerRadius
        return CornerRadius(
            topLeading: normalizeRadiusValue(value.topLeading),
            bottomLeading: normalizeRadiusValue(value.bottomLeading),
            topTrailing: normalizeRadiusValue(value.topTrailing),
            bottomTrailing: normalizeRadiusValue(value.bottomTrailing)
        )
    }

    private static func normalizeRadiusValue(_ value: CGFloat) -> CGFloat {
        value.isFinite && value >= 0 ? value : 0
    }

    private static func decodeCornerRadius(_ value: String?) -> CornerRadius? {
        guard let value, let data = value.data(using: .utf8) else {
            return nil
        }
        return try? JSONDecoder().decode(CornerRadius.self, from: data)
    }
}

@Observable
class OrnamentElement: SpatialObject {
    var options: OrnamentOptions
    private var webViewModel: SpatialWebViewModel

    init(id: String, webViewModel: SpatialWebViewModel, options: OrnamentOptions) {
        self.options = options
        self.webViewModel = webViewModel
        super.init(id)
        self.webViewModel.setBackgroundTransparent(true)
    }

    func getWebViewModel() -> SpatialWebViewModel {
        webViewModel
    }

    func getView() -> SpatialWebView {
        webViewModel.getView()
    }

    func update(_ options: OrnamentOptions) {
        self.options = options
    }

    var attachmentAnchorPoint: UnitPoint3D {
        switch options.attachmentAnchor {
        case "topLeadingFront": return .topLeadingFront
        case "topLeading": return .topLeading
        case "topLeadingBack": return .topLeadingBack
        case "topTrailingFront": return .topTrailingFront
        case "topTrailing": return .topTrailing
        case "topTrailingBack": return .topTrailingBack
        case "leadingFront": return .leadingFront
        case "leading": return .leading
        case "leadingBack": return .leadingBack
        case "front": return .front
        case "center": return .center
        case "back": return .back
        case "trailingFront": return .trailingFront
        case "trailing": return .trailing
        case "trailingBack": return .trailingBack
        case "bottomLeadingFront": return .bottomLeadingFront
        case "bottomLeading": return .bottomLeading
        case "bottomLeadingBack": return .bottomLeadingBack
        case "bottomFront": return .bottomFront
        case "bottomBack": return .bottomBack
        case "bottomTrailingFront": return .bottomTrailingFront
        case "bottomTrailing": return .bottomTrailing
        case "bottomTrailingBack": return .bottomTrailingBack
        default: return .bottom
        }
    }

    var contentAlignment3D: Alignment3D {
        switch options.contentAlignment {
        case "topLeadingFront": return .topLeadingFront
        case "topLeading": return .topLeading
        case "topLeadingBack": return .topLeadingBack
        case "topFront": return .topFront
        case "top": return .top
        case "topBack": return .topBack
        case "topTrailingFront": return .topTrailingFront
        case "topTrailing": return .topTrailing
        case "topTrailingBack": return .topTrailingBack
        case "leadingFront": return .leadingFront
        case "leading": return .leading
        case "leadingBack": return .leadingBack
        case "front": return .front
        case "center": return .center
        case "trailingFront": return .trailingFront
        case "trailing": return .trailing
        case "trailingBack": return .trailingBack
        case "bottomLeadingFront": return .bottomLeadingFront
        case "bottomLeading": return .bottomLeading
        case "bottomLeadingBack": return .bottomLeadingBack
        case "bottomFront": return .bottomFront
        case "bottom": return .bottom
        case "bottomBack": return .bottomBack
        case "bottomTrailingFront": return .bottomTrailingFront
        case "bottomTrailing": return .bottomTrailing
        case "bottomTrailingBack": return .bottomTrailingBack
        default: return .back
        }
    }

    override func onDestroy() {
        webViewModel.destroy()
        super.onDestroy()
    }

    enum CodingKeys: String, CodingKey {
        case options, webviewIsOpaque
    }

    override func encode(to encoder: Encoder) throws {
        try super.encode(to: encoder)
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(options, forKey: .options)
        let isOpaque = webViewModel.getController().webview?.isOpaque ?? false
        try container.encode(isOpaque, forKey: .webviewIsOpaque)
    }
}

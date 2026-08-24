import RealityKit
import SwiftUI

struct OrnamentSingleSelectionCatalog: View {
    enum OrnamentContentKind: String, CaseIterable, Identifiable {
        case label
        case realityBox
        case model

        var id: String {
            rawValue
        }

        var displayName: String {
            switch self {
            case .label: return "Label"
            case .realityBox: return "RealityView Box"
            case .model: return "USDZ Model"
            }
        }
    }

    private static let allAttachmentAnchors: [(name: String, value: UnitPoint3D)] = [
        (".topLeadingBack", .topLeadingBack),
        (".topBack", .topBack),
        (".topTrailingBack", .topTrailingBack),
        (".leadingBack", .leadingBack),
        (".back", .back),
        (".trailingBack", .trailingBack),
        (".bottomLeadingBack", .bottomLeadingBack),
        (".bottomBack", .bottomBack),
        (".bottomTrailingBack", .bottomTrailingBack),
        (".topLeading", .topLeading),
        (".top", .top),
        (".topTrailing", .topTrailing),
        (".leading", .leading),
        (".center", .center),
        (".trailing", .trailing),
        (".bottomLeading", .bottomLeading),
        (".bottom", .bottom),
        (".bottomTrailing", .bottomTrailing),
        (".topLeadingFront", .topLeadingFront),
        (".topFront", .topFront),
        (".topTrailingFront", .topTrailingFront),
        (".leadingFront", .leadingFront),
        (".front", .front),
        (".trailingFront", .trailingFront),
        (".bottomLeadingFront", .bottomLeadingFront),
        (".bottomFront", .bottomFront),
        (".bottomTrailingFront", .bottomTrailingFront),
    ]

    private static let allContentAlignments: [(name: String, value: Alignment3D)] = [
        (".topLeadingBack", .topLeadingBack),
        (".topBack", .topBack),
        (".topTrailingBack", .topTrailingBack),
        (".leadingBack", .leadingBack),
        (".back", .back),
        (".trailingBack", .trailingBack),
        (".bottomLeadingBack", .bottomLeadingBack),
        (".bottomBack", .bottomBack),
        (".bottomTrailingBack", .bottomTrailingBack),
        (".topLeading", .topLeading),
        (".top", .top),
        (".topTrailing", .topTrailing),
        (".leading", .leading),
        (".center", .center),
        (".trailing", .trailing),
        (".bottomLeading", .bottomLeading),
        (".bottom", .bottom),
        (".bottomTrailing", .bottomTrailing),
        (".topLeadingFront", .topLeadingFront),
        (".topFront", .topFront),
        (".topTrailingFront", .topTrailingFront),
        (".leadingFront", .leadingFront),
        (".front", .front),
        (".trailingFront", .trailingFront),
        (".bottomLeadingFront", .bottomLeadingFront),
        (".bottomFront", .bottomFront),
        (".bottomTrailingFront", .bottomTrailingFront),
    ]

    @State private var selectedAttachmentAnchorName = ".top"
    @State private var selectedContentAlignmentName = ".front"
    @State private var selectedContentKind: OrnamentContentKind = .realityBox

    private var selectedAttachmentAnchor: (name: String, value: UnitPoint3D) {
        Self.allAttachmentAnchors.first { $0.name == selectedAttachmentAnchorName } ?? (".bottom", .bottom)
    }

    private var selectedContentAlignment: (name: String, value: Alignment3D) {
        Self.allContentAlignments.first { $0.name == selectedContentAlignmentName } ?? (".back", .back)
    }

    var body: some View {
        HStack(spacing: 24) {
            selectionPanel
            OrnamentSingleContentPreview(
                attachmentAnchorText: selectedAttachmentAnchor.name,
                contentAlignmentText: selectedContentAlignment.name,
                contentKind: selectedContentKind,
                frameSize: 250
            )
        }
        .glassBackgroundEffect()
        .ornament(
            attachmentAnchor: .scene(selectedAttachmentAnchor.value),
            contentAlignment: selectedContentAlignment.value
        ) {
            OrnamentSingleContentPreview(
                attachmentAnchorText: selectedAttachmentAnchor.name,
                contentAlignmentText: selectedContentAlignment.name,
                contentKind: selectedContentKind,
                frameSize: 250
            )
        }
    }

    private var selectionPanel: some View {
        HStack(alignment: .top, spacing: 16) {
            selectorList(
                title: "attachmentAnchor",
                items: Self.allAttachmentAnchors.map(\.name),
                selection: $selectedAttachmentAnchorName
            )

            selectorList(
                title: "contentAlignment",
                items: Self.allContentAlignments.map(\.name),
                selection: $selectedContentAlignmentName
            )

            contentKindSelector
        }
        .padding(24)
    }

    private func selectorList(
        title: String,
        items: [String],
        selection: Binding<String>
    ) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.headline)

            ScrollView {
                LazyVStack(alignment: .leading, spacing: 6) {
                    ForEach(items, id: \.self) { item in
                        Button {
                            selection.wrappedValue = item
                        } label: {
                            Text(item)
                                .font(.caption)
                                .monospaced()
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 8)
                                .background(
                                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                                        .fill(item == selection.wrappedValue ? Color.white.opacity(0.18) : Color.white.opacity(0.06))
                                )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .frame(width: 220, height: 520)
        }
    }

    private var contentKindSelector: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("content")
                .font(.headline)

            ForEach(OrnamentContentKind.allCases) { contentKind in
                Button {
                    selectedContentKind = contentKind
                } label: {
                    Text(contentKind.displayName)
                        .font(.caption)
                        .monospaced()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 8)
                        .background(
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .fill(contentKind == selectedContentKind ? Color.white.opacity(0.18) : Color.white.opacity(0.06))
                        )
                }
                .buttonStyle(.plain)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text("selected")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text("anchor: \(selectedAttachmentAnchor.name)")
                Text("align: \(selectedContentAlignment.name)")
            }
            .font(.caption)
            .monospaced()
            .padding(.top, 12)
        }
        .frame(width: 220, alignment: .topLeading)
    }
}

private struct OrnamentSingleContentPreview: View {
    var title: String = "ornament:"
    let attachmentAnchorText: String
    let contentAlignmentText: String
    let contentKind: OrnamentSingleSelectionCatalog.OrnamentContentKind
    var frameSize: CGFloat

    var body: some View {
        ZStack(alignment: .top) {
            Group {
                switch contentKind {
                case .label:
                    labelContent
                case .realityBox:
                    realityBoxContent
                case .model:
                    modelContent
                }
            }

            if contentKind != .label {
                metadataOverlay
            }
        }
        .frame(width: frameSize, height: frameSize)
        .frame(depth: contentKind == .label ? 0 : frameSize)
        .background(Color.red)
    }

    private var labelContent: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            HStack {
                Text("anchor:")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(attachmentAnchorText)
                    .font(.caption)
                    .monospaced()
            }
            HStack {
                Text("alignment:")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(contentAlignmentText)
                    .font(.caption)
                    .monospaced()
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }

    private var realityBoxContent: some View {
        RealityView { content in
            let box = ModelEntity(
                mesh: .generateBox(size: Float(frameSize - 1) / 1360.0),
                materials: [SimpleMaterial(color: .cyan, isMetallic: false)]
            )
            content.add(box)
        }
    }

    @ViewBuilder
    private var modelContent: some View {
        if let url = Self.modelURL {
            Model3D(url: url) { model in
                model
                    .resizable()
                    .aspectRatio(contentMode: .fit)
            } placeholder: {
                ProgressView()
            }
        } else {
            Text("Missing model")
                .font(.caption)
                .foregroundStyle(.red)
        }
    }

    private var metadataOverlay: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("anchor: \(attachmentAnchorText)")
            Text("align: \(contentAlignmentText)")
        }
        .font(.caption2)
        .monospaced()
        .padding(6)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
    }

    private static var modelURL: URL? {
        let webSpatialRoot = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
        return webSpatialRoot
            .appendingPathComponent("Preview Content")
            .appendingPathComponent("vehicle-speedster.usdz")
    }
}

#Preview(windowStyle: .automatic) {
    OrnamentSingleSelectionCatalog()
}

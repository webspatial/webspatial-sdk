import SwiftUI

private struct OrnamentMaterialBackground: View {
    let backgroundMaterial: BackgroundMaterial
    let cornerRadius: CornerRadius
    let windowStyle: SpatialScene.WindowStyle

    var body: some View {
        let radii = RectangleCornerRadii(
            topLeading: cornerRadius.topLeading,
            bottomLeading: cornerRadius.bottomLeading,
            bottomTrailing: cornerRadius.bottomTrailing,
            topTrailing: cornerRadius.topTrailing
        )

        switch backgroundMaterial {
        case .GlassMaterial:
            if windowStyle == .volume {
                Color.clear
                    .glassBackgroundEffect(
                        in: .rect(cornerRadii: radii),
                        displayMode: .always
                    )
            } else {
                Color.clear
                    .glassBackgroundEffect(
                        in: .rect(cornerRadii: radii),
                        displayMode: .always
                    )
                    .frame(depth: 0)
            }
        case .RegularMaterial:
            Color.clear
                .background(Material.regularMaterial)
                .clipShape(.rect(cornerRadii: radii))
        case .ThinMaterial:
            Color.clear
                .background(Material.thinMaterial)
                .clipShape(.rect(cornerRadii: radii))
        case .ThickMaterial:
            Color.clear
                .background(Material.thickMaterial)
                .clipShape(.rect(cornerRadii: radii))
        default:
            Color.clear
        }
    }
}

private struct OrnamentContentView: View {
    let ornament: OrnamentElement
    let windowStyle: SpatialScene.WindowStyle

    var body: some View {
        let radii = RectangleCornerRadii(
            topLeading: ornament.options.cornerRadius.topLeading,
            bottomLeading: ornament.options.cornerRadius.bottomLeading,
            bottomTrailing: ornament.options.cornerRadius.bottomTrailing,
            topTrailing: ornament.options.cornerRadius.topTrailing
        )

        ZStack {
            OrnamentMaterialBackground(
                backgroundMaterial: ornament.options.backgroundMaterial,
                cornerRadius: ornament.options.cornerRadius,
                windowStyle: windowStyle
            )
            .frame(width: ornament.options.width, height: ornament.options.height)

            ornament.getView()
                .frame(width: ornament.options.width, height: ornament.options.height)
                .clipShape(.rect(cornerRadii: radii))
        }
        .frame(width: ornament.options.width, height: ornament.options.height)
        .opacity(ornament.options.visibility == .visible ? 1 : 0)
        .allowsHitTesting(ornament.options.visibility == .visible)
    }
}

private struct OrnamentStackModifier: ViewModifier {
    let ornaments: [OrnamentElement]
    let windowStyle: SpatialScene.WindowStyle

    func body(content: Content) -> some View {
        ornaments.reduce(AnyView(content)) { current, ornament in
            AnyView(
                current.ornament(
                    attachmentAnchor: .scene(ornament.attachmentAnchorPoint),
                    contentAlignment: ornament.contentAlignment3D
                ) {
                    OrnamentContentView(
                        ornament: ornament,
                        windowStyle: windowStyle
                    )
                }
            )
        }
    }
}

extension View {
    func webSpatialOrnaments(_ ornaments: [OrnamentElement], windowStyle: SpatialScene.WindowStyle) -> some View {
        modifier(OrnamentStackModifier(ornaments: ornaments, windowStyle: windowStyle))
    }
}

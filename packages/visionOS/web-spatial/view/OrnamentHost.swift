import SwiftUI

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
                    ornament.getView()
                        .materialWithBorderCorner(
                            ornament.options.backgroundMaterial,
                            ornament.options.cornerRadius,
                            windowStyle
                        )
                        .frame(width: ornament.options.width, height: ornament.options.height)
                        .opacity(ornament.options.visibility == .visible ? 1 : 0)
                        .allowsHitTesting(ornament.options.visibility == .visible)
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

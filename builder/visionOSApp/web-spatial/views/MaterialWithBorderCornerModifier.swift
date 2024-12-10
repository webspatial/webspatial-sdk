//
//  MaterialWithBorderCornerModifier.swift
//  web-spatial
//
//  Created by ByteDance on 12/4/24.
//
import SwiftUI

enum BackgroundMaterial: String, Codable {
    case None = "none"
    case GlassMaterial = "default"
    case ThickMaterial = "thick"
    case RegularMaterial = "regular"
    case ThinMaterial = "thin"
}

struct CornerRadius: Codable {
    var topLeading: CGFloat = 0
    var bottomLeading: CGFloat = 0
    var topTrailing: CGFloat = 0
    var bottomTrailing: CGFloat = 0
}

struct MaterialWithBorderCornerModifier: ViewModifier {
    let backgroundMaterial: BackgroundMaterial
    let cornerRadius: CornerRadius

    init(_ backgroundMaterial: BackgroundMaterial, _ cornerRadius: CornerRadius) {
        self.backgroundMaterial = backgroundMaterial
        self.cornerRadius = cornerRadius
    }

    func body(content: Content) -> some View {
        let radii = RectangleCornerRadii(topLeading: cornerRadius.topLeading, bottomLeading: cornerRadius.bottomLeading, bottomTrailing: cornerRadius.bottomTrailing, topTrailing: cornerRadius.topTrailing)

        switch backgroundMaterial {
        case .GlassMaterial:
            content
                .glassBackgroundEffect(
                    in: .rect(cornerRadii: radii),
                    displayMode: .always
                )

        case .RegularMaterial:
            content
                .background(Material.regularMaterial)
                .clipShape(.rect(cornerRadii: radii))

        case .ThinMaterial:
            content
                .background(Material.thinMaterial)
                .clipShape(.rect(cornerRadii: radii))

        case .ThickMaterial:
            content
                .background(Material.thickMaterial)
                .clipShape(.rect(cornerRadii: radii))

        default:
            content
                .clipShape(.rect(cornerRadii: radii))
        }
    }
}

extension View {
    func materialWithBorderCorner(_ backgroundMaterial: BackgroundMaterial, _ cornerRadius: CornerRadius) -> some View {
        return modifier(
            MaterialWithBorderCornerModifier(backgroundMaterial, cornerRadius)
        )
    }
}

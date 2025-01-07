import SwiftUI

struct HideViewModifier: ViewModifier {
    let isHidden: Bool
    @ViewBuilder func body(content: Content) -> some View {
        content
            .opacity(isHidden ? 0 : 1)
            .disabled(isHidden)
    }
}

// Extending on View to apply to all Views
extension View {
    func hidden(_ isHidden: Bool) -> some View {
        modifier(HideViewModifier(isHidden: isHidden))
    }
}

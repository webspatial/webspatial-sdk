import SwiftUI

struct HideViewModifierN: ViewModifier {
    let isHidden: Bool
    @ViewBuilder func body(content: Content) -> some View {
        if isHidden {
            content.hidden()
        } else {
            content
        }
    }
}

// Extending on View to apply to all Views
extension View {
    func hidden(_ isHidden: Bool) -> some View {
        modifier(HideViewModifierN(isHidden: isHidden))
    }
}

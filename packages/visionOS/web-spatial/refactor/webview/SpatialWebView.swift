import SwiftUI
@preconcurrency import WebKit

struct SpatialWebView: UIViewRepresentable {
    weak var model: SpatialWebViewModel? = nil
    var url: URL = .init(filePath: "/")

    func makeUIView(context: Context) -> WKWebView {
        print("makeUIView")
        model?.onWebViewUpdate(type: "view:makeUI")
        return model!.getController().webview!
    }

    func makeCoordinator() -> SpatialWebController {
        print("makeCoordinator")
        return model!.getController()
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        print("updateUIView")
        model?.onWebViewUpdate(type: "view:updateUI")
    }

    func destroy() {
        model!.getController().destoryView()
    }

    static func dismantleUIView(_ uiView: WKWebView, coordinator: SpatialWebController) {
        print("dismantleUIView")
        coordinator.destoryView()
    }
}

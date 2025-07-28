import SwiftUI
@preconcurrency import WebKit

struct SpatialWebView: UIViewRepresentable {
    weak var model: SpatialWebViewModel? = nil
    var url: URL = .init(filePath: "/")
    private var webviewStateChangeInvoke: ((_ type: String) -> Void)?

    func makeUIView(context: Context) -> WKWebView {
        webviewStateChangeInvoke?("makeUI")
        return model!.getController().webview!
    }

    func makeCoordinator() -> SpatialWebController {
        return model!.getController()
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        webviewStateChangeInvoke?("updateUI")
    }

    mutating func registerWebviewStateChangeInvoke(invoke: @escaping (_ type: String) -> Void) {
        webviewStateChangeInvoke = invoke
    }

    func destroy() {
        model!.getController().destoryView()
    }

    static func dismantleUIView(_ uiView: WKWebView, coordinator: SpatialWebController) {
        print("dismantleUIView")
        coordinator.destoryView()
    }
}

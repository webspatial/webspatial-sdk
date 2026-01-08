import SwiftUI
@preconcurrency import WebKit

struct SpatialWebView: UIViewRepresentable {
    weak var model: SpatialWebViewModel? = nil
    var url: URL = .init(filePath: "/")
    private var webviewStateChangeInvoke: ((_ type: SpatialWebViewState) -> Void)?

    func makeUIView(context: Context) -> WKWebView {
        webviewStateChangeInvoke?(.didMakeView)
        let webview = model!.getController().webview!
        print("[SpatialWebView] makeUIView returning: \(Unmanaged.passUnretained(webview).toOpaque())")
        return webview
    }

    func makeCoordinator() -> SpatialWebController {
        return model!.getController()
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        webviewStateChangeInvoke?(.didUpdateView)
    }

    mutating func registerWebviewStateChangeInvoke(invoke: @escaping (_ type: SpatialWebViewState) -> Void) {
        webviewStateChangeInvoke = invoke
    }

    mutating func destroy() {
        webviewStateChangeInvoke = nil
        model = nil
    }

    static func dismantleUIView(_ uiView: WKWebView, coordinator: SpatialWebController) {
//        print("dismantleUIView", coordinator.model?.id)
    }
}

import SwiftUI
@preconcurrency import WebKit

struct SpatialWebView: UIViewRepresentable {
    weak var model: SpatialWebViewModel? = nil
    var url: URL = .init(filePath: "/")
    private var webviewStateChangeInvoke: ((_ type: SpatialWebViewState) -> Void)?

    func makeUIView(context: Context) -> WKWebView {
        webviewStateChangeInvoke?(.didMakeView)
        let controller = model?.getController()
        if controller?.webview == nil {
            model?.load()
        }
        return controller?.webview ?? WKWebView(frame: .zero, configuration: WKWebViewConfiguration())
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
        // SwiftUI may tear down the WKWebView without the owning model explicitly calling
        // `SpatialWebViewModel.destroy()`. Always perform a best-effort cleanup here to
        // avoid leaving orphaned WKWebView instances visible to Safari's inspector.
        coordinator.destroyView(uiView)
    }
}

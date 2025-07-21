import SwiftUI
@preconcurrency import WebKit

struct SpatialWebView: UIViewRepresentable {
    weak var model: SpatialWebViewModel? = nil
    weak var controller: SpatialWebController? = nil
    var url: URL = .init(filePath: "/")
    private(set) var webview: WKWebView?

    func makeUIView(context: Context) -> WKWebView {
        return webview!
    }

    mutating func initView(configuration: WKWebViewConfiguration? = nil) {
        let userContentController = WKUserContentController()
        // TODO: get native api instead of PACKAGE_VERSION
        let userScript = WKUserScript(source: "window.WebSpatailEnabled = true; window.WebSpatailNativeVersion = '" + "PACKAGE_VERSION" + "';", injectionTime: .atDocumentStart, forMainFrameOnly: false)
        userContentController.addUserScript(userScript)
        userContentController.add(controller!, name: "bridge")
        let myConfig = (configuration != nil) ? configuration! : WKWebViewConfiguration()
        myConfig.userContentController = userContentController
        myConfig.preferences.javaScriptCanOpenWindowsAutomatically = true
        myConfig.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        if myConfig.urlSchemeHandler(forURLScheme: "file") == nil {
            myConfig.setURLSchemeHandler(controller!, forURLScheme: "file")
        }
        webview = WKWebView(frame: .zero, configuration: myConfig)
        let configUA = myConfig.applicationNameForUserAgent ?? ""
        // change webview ua
        let ua = webview!.value(forKey: "userAgent") as? String ?? ""
        let webviewVersion = ua.split(separator: configUA)[0].split(separator: "AppleWebKit")[1]
        // TODO: get native api instead of PACKAGE_VERSION
        webview!.customUserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit\(webviewVersion)WebSpatial/\("PACKAGE_VERSION")"
        webview!.uiDelegate = controller!
        webview!.allowsBackForwardNavigationGestures = true
        webview!.isInspectable = true
        webview!.allowsLinkPreview = true
        webview!.navigationDelegate = controller!
        webview!.scrollView.delegate = controller!
    }

    func getView() -> WKWebView {
        return webview!
    }

    func callJS(js: String) {
        webview?.evaluateJavaScript(js)
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        model?.onWebViewUpdate(type: "view:updateUI")
    }

    func load(url: String) {
        print("start load")
        webview!.load(URLRequest(url: URL(string: url)!))
    }

    func destroy() {}
}

import SwiftUI
@preconcurrency import WebKit

class WKWebViewManager {
    static let Instance = WKWebViewManager()

    private init() {}

    func create(controller: SpatialWebController, configuration: WKWebViewConfiguration? = nil, spatialId: String? = "") -> WKWebView {
        let userContentController = WKUserContentController()
        // TODO: get native api instead of PACKAGE_VERSION
        let userScript = WKUserScript(source: "window.WebSpatailEnabled = true; window.WebSpatailNativeVersion = 'PACKAGE_VERSION';", injectionTime: .atDocumentStart, forMainFrameOnly: false)
        userContentController.addUserScript(userScript)
//        userContentController.add(controller, name: "bridge")
        userContentController.addScriptMessageHandler(controller, contentWorld: .page, name: "bridge")
        let myConfig = (configuration != nil) ? configuration! : WKWebViewConfiguration()
        myConfig.userContentController = userContentController
        myConfig.preferences.javaScriptCanOpenWindowsAutomatically = true
        if myConfig.urlSchemeHandler(forURLScheme: "ws-file") == nil {
            myConfig.setURLSchemeHandler(CustomSchemeHandler(), forURLScheme: "ws-file")
        }
        controller.webview = WKWebView(frame: .zero, configuration: myConfig)
        let configUA = myConfig.applicationNameForUserAgent ?? ""
        // change webview ua
        let ua = controller.webview!.value(forKey: "userAgent") as? String ?? ""
        let webviewVersion = ua.split(separator: configUA)[0].split(separator: "AppleWebKit")[1]
        // TODO: get native api instead of PACKAGE_VERSION
        controller.webview!.customUserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit\(webviewVersion)WebSpatial/\("PACKAGE_VERSION") SpatialID/\(spatialId!)"
        controller.webview!.uiDelegate = controller
        controller.webview!.allowsBackForwardNavigationGestures = false
        controller.webview!.isInspectable = true
        controller.webview!.allowsLinkPreview = true
        controller.webview!.navigationDelegate = controller
        controller.webview!.scrollView.delegate = controller

        if let webview = controller.webview {
//            webview.scrollView.isScrollEnabled = false
            webview.scrollView.bounces = false
            webview.scrollView.showsVerticalScrollIndicator = false
            webview.scrollView.showsHorizontalScrollIndicator = false
        }

        controller.startObserving()
        return controller.webview!
    }
}

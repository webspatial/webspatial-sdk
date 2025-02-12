//
//  NativeWebView.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import Combine
import Foundation
import RealityKit
import RealityKitContent
import SwiftUI
import WebKit

class WebViewHolder {
    var needsUpdate = false
    var appleWebView: WKWebView?
    var webViewCoordinator: Coordinator?
    deinit {
        appleWebView = nil
    }
}

struct PreloadStyleSettings: Codable {
    var cornerRadius: CornerRadius? = .init()
    var backgroundMaterial: BackgroundMaterial? = .None
}

struct WebviewEarlyStyle {
    let webview: WKWebView
    let style: PreloadStyleSettings
}

// event of forcestyle handler
var webviewGetEarlyStyleData = PassthroughSubject<WebviewEarlyStyle, Never>()

class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler, WKUIDelegate, UIScrollViewDelegate, WKURLSchemeHandler {
    let decoder = JSONDecoder()
    override public init() {
        WKWebView.enableFileScheme() // ensure the handler is usable
    }

    func webView(_ webView: WKWebView, start urlSchemeTask: any WKURLSchemeTask) {
        // Parse the style json string from url
        let url = urlSchemeTask.request.url
        // 本地web项目通过相对路径访问资源会默认使用file协议
        // Local web projects accessing resources through relative paths will default to using the file protocol
        if url!.absoluteString.starts(with: "file://") {
            let session = URLSession(configuration: URLSessionConfiguration.default)
            let dataTask = session.dataTask(with: urlSchemeTask.request) { data, response, _ in
                urlSchemeTask.didReceive(response!)
                urlSchemeTask.didReceive(data!)
                urlSchemeTask.didFinish()
            }
            dataTask.resume()
            return
        }

        var styleJsonString: String? = URLComponents(string: url!.absoluteString)?.queryItems?.first(where: { $0.name == "style" })?.value

        do {
            if styleJsonString?.contains("?") != nil {
                // remove invalid query string
                // before "{\"glassEffect\":true,\"cornerRadius\":50}?uniqueURL=0.0010192470591506853"
                // after "{\"glassEffect\":true,\"cornerRadius\":50}"
                styleJsonString = styleJsonString?
                    .components(separatedBy: "?").first
            }
            let styleToSet = try decoder.decode(PreloadStyleSettings.self, from: styleJsonString!.data(using: .utf8)!)

            webviewGetEarlyStyleData.send(WebviewEarlyStyle(webview: webView, style: styleToSet))

            // Respond with empty css file
            let response = ".ignoreThis{}".data(using: .utf8)
            let mimeType = "text/css"
            let headers = ["Content-Type": mimeType, "Cache-Control": "no-cache"]
            let resp = HTTPURLResponse(url: url!, statusCode: 200, httpVersion: "1.1", headerFields: headers)

            urlSchemeTask.didReceive(resp!)
            urlSchemeTask.didReceive(response!)
            urlSchemeTask.didFinish()

            return
        } catch {
            print("Style url parse failure " + error.localizedDescription)
        }
        urlSchemeTask.didFinish()
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: any WKURLSchemeTask) {}

    @Environment(\.openWindow) private var openWindow
    @Environment(\.dismissWindow) private var dismissWindow
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace

    deinit {}

    weak var webViewRef: SpatialWindowComponent? = nil

    func webView(_ webView: WKWebView, didStartProvisionalNavigation: WKNavigation!) {
        webViewRef?.didStartLoadPage()
    }

    func webView(
        _ webView: WKWebView,
        didCommit navigation: WKNavigation!
    ) {
        webViewRef?.didStartReceivePageContent()
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        webViewRef?.loadRequestWV?.didLoadChild(loadRequestID: webViewRef!.loadRequestID, resourceID: webViewRef!.id)
        webViewRef?.loadRequestID = -1
        webViewRef?.didFinishLoadPage()
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Swift.Void) {
        if let url = navigationAction.request.url,
           url.absoluteString == "webspatial://createWindowContext"
        {
            decisionHandler(.cancel)
            return
        }
        if pwaManager.checkInScope(url: navigationAction.request.url!.absoluteString) {
            decisionHandler(.allow)
        } else {
            decisionHandler(.cancel)
            UIApplication.shared.open(navigationAction.request.url!, options: [:], completionHandler: nil)
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse, decisionHandler: @escaping (WKNavigationResponsePolicy) -> Swift.Void) {
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("Navigation failed!!! " + error.localizedDescription)
        if let urlError = (error as? URLError) {
            print("URL ERROR: " + (urlError.failingURL != nil ? (urlError.failingURL!.absoluteString) : "no URL found"))
            if urlError.code == .cannotConnectToHost {
                webViewRef?.didFailLoadPage()
            }
        }
    }

    // Warning this should likeley be removed. There seems to be a bug with SSL loading on simulator https://stackoverflow.com/questions/27100540/allow-unverified-ssl-certificates-in-wkwebview
    // NSAllowsArbitraryLoads should also be removed from Info.plist if shipping an app
    // this is the workaround
    func webView(_ webView: WKWebView, didReceive challenge: URLAuthenticationChallenge, completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        guard let serverTrust = challenge.protectionSpace.serverTrust else { return completionHandler(.useCredential, nil) }
        let exceptions = SecTrustCopyExceptions(serverTrust)
        SecTrustSetExceptions(serverTrust, exceptions)
        completionHandler(.useCredential, URLCredential(trust: serverTrust))
    }

    func webView(
        _ webView: WKWebView,
        createWebViewWith configuration: WKWebViewConfiguration,
        for navigationAction: WKNavigationAction,
        windowFeatures: WKWindowFeatures
    ) -> WKWebView? {
        let url = navigationAction.request.url?.absoluteString ?? ""

        if url != "webspatial://createWindowContext",
           !pwaManager.checkInScope(url: url)
        {
            // open in safari
            UIApplication.shared.open(navigationAction.request.url!, options: [:], completionHandler: nil)
            return nil
        }

        let wvNative = WebViewNative()

        _ = wvNative.createResources(configuration: configuration)

        webViewRef!.didSpawnWebView(wv: wvNative)

        return wvNative.webViewHolder.appleWebView
    }

    // handle close
    func webViewDidClose(_ webView: WKWebView) {
        webViewRef!.didCloseWebView()
    }

    // receive message from wkwebview
    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        let command = CommandManager.Instance.decode(jsonData: message.body as! String)
        if let wv = webViewRef {
            CommandManager.Instance.doCommand(target: wv, jsb: command)
        }
    }

    func scrollViewDidScroll(_ scrollView: UIScrollView) {
        webViewRef?.scrollOffset = scrollView.contentOffset
        if webViewRef != nil {
            let wg = SpatialWindowGroup.getSpatialWindowGroup(webViewRef!.parentWindowGroupID)!
            wg.updateFrame = !(wg.updateFrame)
        }
    }
}

struct WebViewNative: UIViewRepresentable {
    weak var webViewRef: SpatialWindowComponent? = nil
    var url: URL = .init(filePath: "/")
    var webViewHolder = WebViewHolder()

    func destroy() {
        // Remove references to Coordinator so that it gets cleaned up by arc
        webViewHolder.appleWebView?.configuration.userContentController.removeScriptMessageHandler(forName: "bridge")
        webViewHolder.appleWebView?.uiDelegate = nil
        webViewHolder.appleWebView?.navigationDelegate = nil
        webViewHolder.appleWebView?.scrollView.delegate = nil
        webViewHolder.appleWebView = nil
    }

    func makeCoordinator() -> Coordinator {
        let c = Coordinator()
        c.webViewRef = webViewRef
        return c
    }

    func createResources(configuration: WKWebViewConfiguration? = nil) -> WKWebView {
        if webViewHolder.appleWebView == nil {
            webViewHolder.webViewCoordinator = makeCoordinator()
            let userContentController = WKUserContentController()

            let userScript = WKUserScript(source: "window.WebSpatailEnabled = true; window.WebSpatailNativeVersion = '" + nativeAPIVersion + "';", injectionTime: .atDocumentStart, forMainFrameOnly: false)
            userContentController.addUserScript(userScript)
            userContentController.add(webViewHolder.webViewCoordinator!, name: "bridge")

            let myConfig = (configuration != nil) ? configuration! : WKWebViewConfiguration()
            myConfig.userContentController = userContentController
            myConfig.preferences.javaScriptCanOpenWindowsAutomatically = true
            myConfig.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")

            if myConfig.urlSchemeHandler(forURLScheme: "forceStyle") == nil {
                myConfig.setURLSchemeHandler(webViewHolder.webViewCoordinator, forURLScheme: "forceStyle")
            }
            if myConfig.urlSchemeHandler(forURLScheme: "file") == nil {
                myConfig.setURLSchemeHandler(webViewHolder.webViewCoordinator, forURLScheme: "file")
            }
            webViewHolder.appleWebView = WKWebView(frame: .zero, configuration: myConfig)
            webViewHolder.appleWebView!.uiDelegate = webViewHolder.webViewCoordinator
            webViewHolder.appleWebView!.allowsBackForwardNavigationGestures = true
            webViewHolder.appleWebView!.isInspectable = true
            webViewHolder.appleWebView!.allowsLinkPreview = true
            webViewHolder.appleWebView!.navigationDelegate = webViewHolder.webViewCoordinator
            webViewHolder.appleWebView!.scrollView.delegate = webViewHolder.webViewCoordinator
            webViewHolder.appleWebView!.isOpaque = false
            webViewHolder.needsUpdate = (configuration != nil) ? false : true
        }

        return webViewHolder.appleWebView!
    }

    func initialLoad() {
        if webViewHolder.needsUpdate {
            let request = URLRequest(url: url)
            webViewHolder.appleWebView!.load(request)
            webViewHolder.appleWebView!.isOpaque = false
            webViewHolder.appleWebView!.backgroundColor = UIColor.clear
            webViewHolder.needsUpdate = false
        }
    }

    func makeUIView(context: Context) -> WKWebView {
        return createResources()
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        initialLoad()
    }
}

// extend webview to support file://
@available(iOS 11.0, *)
extension WKWebView {
    /// WKWebView, 支持configuration里设置file scheme
    /// WKWebView,  Support setting file scheme in configuration
    public private(set) static var isEnableFileSupport = false
    public static func enableFileScheme() {
        /// 这种方式支持通过Configuration适配支持的file，但没法取消(configuration是不可变的)。
        /// This method supports adapting supported files through Configuration, but cannot be cancelled (Configuration is immutable).
        if !isEnableFileSupport {
            switchHandlesURLScheme()
        }
    }

    private static func switchHandlesURLScheme() {
        if
            case let cls = WKWebView.self,
            let m1 = class_getClassMethod(cls, NSSelectorFromString("handlesURLScheme:")),
            let m2 = class_getClassMethod(cls, #selector(WKWebView.wrapHandles(urlScheme:)))
        {
            method_exchangeImplementations(m1, m2)
            isEnableFileSupport = !isEnableFileSupport
        }
    }

    /// 返回true如果WKWebview支持处理这种协议, 但WKWebview默认支持http，所以返回false支持用自定义的http Handlers
    /// Return true if WKWebview supports handling this protocol, but WKWebview supports HTTP by default, so return false to support using custom HTTP Handler
    @objc private dynamic
    static func wrapHandles(urlScheme: String) -> Bool {
        if urlScheme == "file" { return false }
        return wrapHandles(urlScheme: urlScheme)
    }
}

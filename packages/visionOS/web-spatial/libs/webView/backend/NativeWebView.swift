import Combine
import Foundation
import RealityKit
import RealityKitContent
import SwiftUI
@preconcurrency import WebKit

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

        // Local web projects accessing resources through relative paths will default to using the file protocol
        if url!.absoluteString.starts(with: "file://") {
            let resource: String = pwaManager.getLocalResourceURL(url: url!.absoluteString)
            var urlRequest = urlSchemeTask.request

            if resource != "" {
                urlRequest = URLRequest(url: URL(string: resource)!)
            } else {
                return
            }
            let session = URLSession(configuration: URLSessionConfiguration.default)
            let dataTask = session.dataTask(with: urlRequest) { [task = urlSchemeTask as AnyObject] data, response, _ in
                guard let task = task as? WKURLSchemeTask else { return }

                task.didReceive(response!)
                task.didReceive(data!)
                task.didFinish()
            }
            dataTask.resume()
            return
        }
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
        if let url = navigationAction.request.url,
           url.absoluteString.starts(with: "forcestyle://")
        {
            var styleJsonString: String? = URLComponents(string: url.absoluteString)?.queryItems?.first(where: { $0.name == "style" })?.value
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
            } catch {
                logger.warning("Style url parse failure " + error.localizedDescription)
            }
            decisionHandler(.cancel)
            return
        }
        var resource = navigationAction.request.url!.absoluteString
        if pwaManager.isLocal {
            resource = pwaManager.getLocalResourceURL(url: resource)
        }
        if pwaManager.checkInScope(url: navigationAction.request.url!.absoluteString) {
            if navigationAction.navigationType == .backForward {
                // backward/forward
                webViewRef?.didNavBackForward()
            }
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
        logger.warning("Navigation failed!!! " + error.localizedDescription)
        if let urlError = (error as? URLError) {
            logger.warning("URL ERROR: " + (urlError.failingURL != nil ? (urlError.failingURL!.absoluteString) : "no URL found"))
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
        var resource = navigationAction.request.url!.absoluteString
        if pwaManager.isLocal {
            resource = pwaManager.getLocalResourceURL(url: resource)
        }
        if resource != "webspatial://createWindowContext",
           !pwaManager.checkInScope(url: resource)
        {
            // open in safari
            UIApplication.shared.open(navigationAction.request.url!, options: [:], completionHandler: nil)
            return nil
        }

        var wvNative = WebViewNative()
        var needsUpdate = false
        if resource.starts(with: "file://") {
            wvNative.url = URL(string: resource)!
            needsUpdate = true
        }
        _ = wvNative.createResources(configuration: configuration, needsUpdate: needsUpdate)

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
            let wg = SpatialWindowContainer.getSpatialWindowContainer(webViewRef!.parentWindowContainerID)!
            wg.updateFrame = !(wg.updateFrame)
        }
    }

    private var isObserving = false
    func startObserving(webView: WKWebView) {
        guard !isObserving else { return }
        webView.addObserver(self, forKeyPath: #keyPath(WKWebView.url), options: .new, context: nil)
        isObserving = true
    }

    func stopObserving(webView: WKWebView) {
        guard isObserving else { return }
        webView.removeObserver(self, forKeyPath: #keyPath(WKWebView.url))
        isObserving = false
    }

    override func observeValue(
        forKeyPath keyPath: String?,
        of object: Any?,
        change: [NSKeyValueChangeKey: Any]?,
        context: UnsafeMutableRawPointer?
    ) {
        if keyPath == #keyPath(WKWebView.url),
           let url = (object as? WKWebView)?.url?.absoluteString
        {
            DispatchQueue.main.async {
                self.webViewRef?.navInfo.url = url
            }
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

    func createResources(configuration: WKWebViewConfiguration? = nil, needsUpdate: Bool = false) -> WKWebView {
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
            if myConfig.urlSchemeHandler(forURLScheme: "file") == nil {
                myConfig.setURLSchemeHandler(webViewHolder.webViewCoordinator, forURLScheme: "file")
            }
            webViewHolder.appleWebView = WKWebView(frame: .zero, configuration: myConfig)
            webViewHolder.webViewCoordinator!.startObserving(webView: webViewHolder.appleWebView!)
            let configUA = myConfig.applicationNameForUserAgent as? String ?? ""

            // change webview ua
            let ua = webViewHolder.appleWebView?.value(forKey: "userAgent") as? String ?? ""
            let webviewVersion = ua.split(separator: configUA)[0].split(separator: "AppleWebKit")[1]
            webViewHolder.appleWebView!.customUserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit\(webviewVersion)WebSpatial/\(nativeAPIVersion)"

            webViewHolder.appleWebView!.uiDelegate = webViewHolder.webViewCoordinator
            webViewHolder.appleWebView!.allowsBackForwardNavigationGestures = true
            webViewHolder.appleWebView!.isInspectable = true
            webViewHolder.appleWebView!.allowsLinkPreview = true
            webViewHolder.appleWebView!.navigationDelegate = webViewHolder.webViewCoordinator
            webViewHolder.appleWebView!.scrollView.delegate = webViewHolder.webViewCoordinator
            webViewHolder.needsUpdate = (configuration != nil && !needsUpdate) ? false : true
        }

        return webViewHolder.appleWebView!
    }

    func initialLoad() {
        if webViewHolder.needsUpdate {
            let request = URLRequest(url: url)
            webViewHolder.appleWebView!.load(request)
            webViewHolder.needsUpdate = false
        }
    }

    func makeUIView(context: Context) -> WKWebView {
        return createResources()
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        initialLoad()
    }

    static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
        coordinator.stopObserving(webView: uiView)
    }
}

// extend webview to support file://
@available(iOS 11.0, *)
extension WKWebView {
    /// WKWebView,  Support setting file scheme in configuration
    public private(set) static var isEnableFileSupport = false
    public static func enableFileScheme() {
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

    /// Return true if WKWebview supports handling this protocol, but WKWebview supports HTTP by default, so return false to support using custom HTTP Handler
    @objc private dynamic
    static func wrapHandles(urlScheme: String) -> Bool {
        if urlScheme == "file" { return false }
        return wrapHandles(urlScheme: urlScheme)
    }
}

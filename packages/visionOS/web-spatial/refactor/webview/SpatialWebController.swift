import SwiftUI
@preconcurrency import WebKit

class SpatialWebController: NSObject, WKNavigationDelegate, WKScriptMessageHandlerWithReply, WKUIDelegate, UIScrollViewDelegate, WKURLSchemeHandler {
    var id: String
    weak var model: SpatialWebViewModel?
    private var isObserving = false
    private var navigationInvoke: ((_ data: URL) -> Bool)?
    private var openWindowInvoke: ((_ data: URL) -> SpatialWebViewModel?)?
    private var jsbInvoke: ((_ data: String, _ promise: JSBManager.Promise) -> Void)?
    var webview: WKWebView?

    override init() {
        id = UUID().uuidString
        WKWebView.enableFileScheme() // ensure the handler is usable
    }

    deinit {}

    func registerNavigationInvoke(invoke: @escaping (_ data: URL) -> Bool) {
        navigationInvoke = invoke
    }

    func registerOpenWindowInvoke(invoke: @escaping (_ data: URL) -> SpatialWebViewModel?) {
        openWindowInvoke = invoke
    }

    func registerJSBInvoke(invoke: @escaping (_ data: String, _ promise: JSBManager.Promise) -> Void) {
        jsbInvoke = invoke
    }

    // navigation request
    // SpatialDiv/forcestyle/normal web link protocol
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Swift.Void) {
        if let deciside = navigationInvoke?(navigationAction.request.url!) {
            decisionHandler(deciside ? .allow : .cancel)
            return
        }
        decisionHandler(.allow)
    }

    // open window request
    func webView(
        _ webView: WKWebView,
        createWebViewWith configuration: WKWebViewConfiguration,
        for navigationAction: WKNavigationAction,
        windowFeatures: WKWindowFeatures
    ) -> WKWebView? {
        if let model = openWindowInvoke?(navigationAction.request.url!) {
            return model.getController().webview
        }
        return nil
    }

    // invoke jsb
    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage, replyHandler: @escaping (Any?, String?) -> Void
    ) {
        let promise = JSBManager.Promise(replyHandler)
        jsbInvoke?(message.body as! String, promise)
    }

    // custom scheme request
    func webView(_ webView: WKWebView, start urlSchemeTask: any WKURLSchemeTask) {
        print("urlSchemeTask")
        let url = urlSchemeTask.request.url
        if url!.absoluteString.starts(with: "file://") {
            var urlRequest = urlSchemeTask.request

            let session = URLSession(configuration: URLSessionConfiguration.default)
            let dataTask = session.dataTask(with: urlRequest) { [task = urlSchemeTask as AnyObject] data, response, _ in
                guard let task = task as? WKURLSchemeTask else { return }

                task.didReceive(response!)
                task.didReceive(data!)
                task.didFinish()
            }
            dataTask.resume()
        }
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: any WKURLSchemeTask) {}
    func webView(_ webView: WKWebView, didStartProvisionalNavigation: WKNavigation!) {
        model?.onWebViewUpdate(type: "controller:didStartLoadPage")
    }

    func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
        model?.onWebViewUpdate(type: "controller:didReceivePageContent")
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        model?.onWebViewUpdate(type: "controller:didFinishLoadPage")
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse, decisionHandler: @escaping (WKNavigationResponsePolicy) -> Swift.Void) {
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        if let urlError = (error as? URLError) {
            if urlError.code == .cannotConnectToHost {
                model?.onWebViewUpdate(type: "controller:didFailLoadPage")
            }
        }
    }

    func webView(_ webView: WKWebView, didReceive challenge: URLAuthenticationChallenge, completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        guard let serverTrust = challenge.protectionSpace.serverTrust else { return completionHandler(.useCredential, nil) }
        let exceptions = SecTrustCopyExceptions(serverTrust)
        SecTrustSetExceptions(serverTrust, exceptions)
        completionHandler(.useCredential, URLCredential(trust: serverTrust))
    }

    func scrollViewDidScroll(_ scrollView: UIScrollView) {
        model!.onUpdateScroll(point: scrollView.contentOffset)
    }

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
                print("url change", url)
                self.model?.url = url
            }
        }
    }

    func destoryView() {
        webview?.configuration.userContentController.removeScriptMessageHandler(forName: "bridge")
        webview?.uiDelegate = nil
        webview?.navigationDelegate = nil
        webview?.scrollView.delegate = nil
        webview = nil
    }

    func callJS(_ js: String) {
        if webview != nil {
            webview!.evaluateJavaScript(js)
        }
    }
}

//// extend webview to support file://
// @available(iOS 11.0, *)
// extension WKWebView {
//    /// WKWebView,  Support setting file scheme in configuration
//    public private(set) static var isEnableFileSupport = false
//    public static func enableFileScheme() {
//        /// This method supports adapting supported files through Configuration, but cannot be cancelled (Configuration is immutable).
//        if !isEnableFileSupport {
//            switchHandlesURLScheme()
//        }
//    }
//
//    private static func switchHandlesURLScheme() {
//        if
//            case let cls = WKWebView.self,
//            let m1 = class_getClassMethod(cls, NSSelectorFromString("handlesURLScheme:")),
//            let m2 = class_getClassMethod(cls, #selector(WKWebView.wrapHandles(urlScheme:)))
//        {
//            method_exchangeImplementations(m1, m2)
//            isEnableFileSupport = !isEnableFileSupport
//        }
//    }
//
//    /// Return true if WKWebview supports handling this protocol, but WKWebview supports HTTP by default, so return false to support using custom HTTP Handler
//    @objc private dynamic
//    static func wrapHandles(urlScheme: String) -> Bool {
//        if urlScheme == "file" { return false }
//        return wrapHandles(urlScheme: urlScheme)
//    }
// }

import SwiftUI
@preconcurrency import WebKit

class SpatialWebController: NSObject, WKNavigationDelegate, WKScriptMessageHandlerWithReply, WKUIDelegate, UIScrollViewDelegate {
    weak var model: SpatialWebViewModel?
    var webview: WKWebView?
    private var isObserving = false
    private var navigationInvoke: ((_ data: URL) -> Bool)?
    private var openWindowInvoke: ((_ data: URL) -> WebViewElementInfo?)?
    private var webviewStateChangeInvoke: ((_ type: SpatialWebViewState) -> Void)?
    private var scorllUpdateInvoke: ((_ type: ScrollState, _ point: CGPoint) -> Void)?
    private var webviewTitle: String?
    private var firstLoad = true
    private var jsbManager = JSBManager()

    deinit {}

    func registerNavigationInvoke(invoke: @escaping (_ data: URL) -> Bool) {
        navigationInvoke = invoke
    }

    func registerOpenWindowInvoke(invoke: @escaping (_ data: URL) -> WebViewElementInfo?) {
        openWindowInvoke = invoke
    }

    func registeJSBHandler<T: CommandDataProtocol>(_ type: T.Type, _ event: @escaping (T, @escaping JSBManager.ResolveHandler<Encodable>) -> Void) {
        jsbManager.register(type, event)
    }

    func registeJSBHandler<T: CommandDataProtocol>(_ type: T.Type, _ event: @escaping (@escaping JSBManager.ResolveHandler<Encodable>) -> Void) {
        jsbManager.register(type, event)
    }

    func unregisterJSBHandler<T: CommandDataProtocol>(_ type: T.Type) {
        jsbManager.remove(type)
    }

    func clearJSBHandler() {
        jsbManager.clear()
    }

    func mockJSB(_ command: String) {
        jsbManager.handlerMessage(command)
    }

    func registerWebviewStateChangeInvoke(invoke: @escaping (_ type: SpatialWebViewState) -> Void) {
        webviewStateChangeInvoke = invoke
    }

    func registerScrollUpdateInvoke(invoke: @escaping (_ type: ScrollState, _ point: CGPoint) -> Void) {
        scorllUpdateInvoke = invoke
    }

    func setWebViewTitle(_ title: String) {
        webviewTitle = title
        if webview != nil {
            callJS("document.title='\(title)'")
        }
    }

    // navigation request
    // SpatialDiv/forcestyle/normal web link protocol
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Swift.Void) {
        let deciside = navigationInvoke?(navigationAction.request.url!)
        if deciside == true {
            if !firstLoad {
                webviewStateChangeInvoke?(.didUnload)
            }
            firstLoad = false
        }
        var needAllow = deciside ?? false

        if !needAllow {
            UIApplication.shared.open(navigationAction.request.url!, options: [:], completionHandler: nil)
        }
        decisionHandler(needAllow ? .allow : .cancel)
    }

    // open window request
    func webView(
        _ webView: WKWebView,
        createWebViewWith configuration: WKWebViewConfiguration,
        for navigationAction: WKNavigationAction,
        windowFeatures: WKWindowFeatures
    ) -> WKWebView? {
        if let modelInfo = openWindowInvoke?(navigationAction.request.url!) {
            modelInfo.element.load(configuration, modelInfo.id)
            return modelInfo.element.getController().webview
        }
        print("no webview")
        return nil
    }

    // invoke jsb
    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage, replyHandler: @escaping (Any?, String?) -> Void
    ) {
//        let promise = JSBManager.Promise(replyHandler)
        jsbManager.handlerMessage(message.body as! String, replyHandler)
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation: WKNavigation!) {
        webviewStateChangeInvoke?(.didStartLoad)
    }

    func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
        webviewStateChangeInvoke?(.didReceive)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        webviewStateChangeInvoke?(.didFinishLoad)
        if webviewTitle != nil {
            callJS("document.title='\(webviewTitle!)'")
        }
        // flush pending calljs comand
        isPageLoaded = true
        flushJSQueue()
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse, decisionHandler: @escaping (WKNavigationResponsePolicy) -> Swift.Void) {
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        if let urlError = (error as? URLError) {
            if urlError.code == .cannotConnectToHost {
                webviewStateChangeInvoke?(.didFailLoad)
            }
        }
    }

    func webViewDidClose(_ webView: WKWebView) {
        webviewStateChangeInvoke?(.didClose)
    }

    func webView(_ webView: WKWebView, didReceive challenge: URLAuthenticationChallenge, completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        guard let serverTrust = challenge.protectionSpace.serverTrust else { return completionHandler(.useCredential, nil) }
        let exceptions = SecTrustCopyExceptions(serverTrust)
        SecTrustSetExceptions(serverTrust, exceptions)
        completionHandler(.useCredential, URLCredential(trust: serverTrust))
    }

    func scrollViewWillBeginDragging(_ scrollView: UIScrollView) {
        scorllUpdateInvoke?(.start, scrollView.contentOffset)
    }

    func scrollViewDidScroll(_ scrollView: UIScrollView) {
        scorllUpdateInvoke?(.update, scrollView.contentOffset)
    }

    func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) {
        scorllUpdateInvoke?(.end, scrollView.contentOffset)
    }

    func scrollViewDidEndDragging(_ scrollView: UIScrollView, willDecelerate decelerate: Bool) {
        if !decelerate {
            scorllUpdateInvoke?(.end, scrollView.contentOffset)
        } else {
            scorllUpdateInvoke?(.release, scrollView.contentOffset)
        }
    }

    func startObserving() {
        guard !isObserving else { return }
        webview?.addObserver(self, forKeyPath: #keyPath(WKWebView.url), options: .new, context: nil)
        isObserving = true
    }

    func stopObserving() {
        guard isObserving else { return }
        webview?.removeObserver(self, forKeyPath: #keyPath(WKWebView.url))
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
//                print("url change", url)
                self.model?.url = url
            }
        }
    }

    func destroy() {
        destroyView()
        navigationInvoke = nil
        openWindowInvoke = nil
        webviewStateChangeInvoke = nil
        scorllUpdateInvoke = nil
        model = nil
    }

    private var state: SpatialWebViewState?

    func destroyView() {
        stopObserving()
        if webview != nil {
            webview?.stopLoading()
            webview?.configuration.userContentController.removeScriptMessageHandler(forName: "bridge")
            webview?.uiDelegate = nil
            webview?.navigationDelegate = nil
            webview?.scrollView.delegate = nil
            webview = nil
            webviewStateChangeInvoke?(.didDestroyView)
        }
    }

    private var isPageLoaded = false

    private var jsQueue: [String] = []

    private func enqueueJS(_ js: String) {
        jsQueue.append(js)
    }

    private func flushJSQueue() {
        guard !jsQueue.isEmpty else { return }
        let combined = jsQueue.joined(separator: ";")
        callJS(combined)
        jsQueue.removeAll()
    }

    func callJS(_ js: String) {
        if webview != nil, isPageLoaded {
            webview!.evaluateJavaScript(js)
        } else {
            enqueueJS(js)
        }
    }
}

enum ScrollState {
    case start
    case update
    case release
    case end
}

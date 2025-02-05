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
    func webView(_ webView: WKWebView, start urlSchemeTask: any WKURLSchemeTask) {
        // Parse the style json string from url
        let url = urlSchemeTask.request.url
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
        // print("try nav " + navigationAction.request.url!.absoluteString)
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse, decisionHandler: @escaping (WKNavigationResponsePolicy) -> Swift.Void) {
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("Navigation failed!!! " + error.localizedDescription)
        webViewRef?.didFailLoadPage()
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
        // check url
        if let url = navigationAction.request.url {
            // TODO: pwa logic
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

            if myConfig.urlSchemeHandler(forURLScheme: "forceStyle") == nil {
                myConfig.setURLSchemeHandler(webViewHolder.webViewCoordinator, forURLScheme: "forceStyle")
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

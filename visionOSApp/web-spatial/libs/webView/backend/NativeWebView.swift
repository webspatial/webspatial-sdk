//
//  NativeWebView.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import Foundation

import RealityKit
import RealityKitContent
import SwiftUI

import WebKit

var wgManager = WindowGroupManager()

class WebViewHolder {
    var needsUpdate = false
    var appleWebView: WKWebView?
    var webViewCoordinator: Coordinator?
    deinit {
        appleWebView = nil
    }
}

class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler, WKUIDelegate, UIScrollViewDelegate {
    @Environment(\.openWindow) private var openWindow
    @Environment(\.dismissWindow) private var dismissWindow
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace

    deinit {}
    
    weak var webViewRef: SpatialWebView? = nil
    
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
        webViewRef?.loadRequestWV?.didLoadChild(loadRequestID: webViewRef!.loadRequestID, resourceID: webViewRef!.resourceID)
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
    }
    
    func webView(
        _ webView: WKWebView,
        createWebViewWith configuration: WKWebViewConfiguration,
        for navigationAction: WKNavigationAction,
        windowFeatures: WKWindowFeatures
    ) -> WKWebView? {
        print("webview?")
        //  print(windowFeatures.value(forKey: <#T##String#>))
        //        var value = windowFeatures.value(forKey: "webSpatialId")
//        print(value)
        //  let newWebView = WKWebView(frame: webView.bounds, configuration: configuration)
        var wvNative = WebViewNative()
        wvNative.createResources(configuration: configuration)
        
        // webViewRef?.getView()!.webViewHolder.appleWebView = wvNative.webViewHolder.appleWebView
        
        // newWebView.evaluateJavaScript("", completionHandler: <#T##((Any?, (any Error)?) -> Void)?##((Any?, (any Error)?) -> Void)?##(Any?, (any Error)?) -> Void#>)
        webViewRef?.didSpawnWebView(wv: wvNative)
        //  webViewRef?.didSpawnWebView(wv: newWebView)
        return wvNative.webViewHolder.appleWebView
    }

    // receive message from wkwebview
    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        let json = JsonParser(str: message.body as? String)
        if let wv = webViewRef {
            // Don't process message if new page is already loaded
            if message.frameInfo.request.url!.path() == wv.getURL()?.path() {
                wv.onJSScriptMessage(json: json)
            }
        }
    }
    
    func scrollViewDidScroll(_ scrollView: UIScrollView) {
        webViewRef?.scrollOffset = scrollView.contentOffset
        if webViewRef != nil {
            let wg = wgManager.getWindowGroup(windowGroup: webViewRef!.parentWindowGroupID)
            wg.updateFrame = !(wg.updateFrame)
        }
    }
}

struct WebViewNative: UIViewRepresentable {
    weak var webViewRef: SpatialWebView? = nil
    var url: URL = .init(filePath: "/")
    var webViewHolder = WebViewHolder()
    
    func makeCoordinator() -> Coordinator {
        let c = Coordinator()
        c.webViewRef = webViewRef
        return c
    }
    
    func createResources(configuration: WKWebViewConfiguration? = nil) -> WKWebView {
        if webViewHolder.appleWebView == nil {
            webViewHolder.webViewCoordinator = makeCoordinator()
            let userContentController = WKUserContentController()
            
            let userScript = WKUserScript(source: "window.WebSpatailEnabled = true", injectionTime: .atDocumentStart, forMainFrameOnly: false)
            userContentController.addUserScript(userScript)
            userContentController.add(webViewHolder.webViewCoordinator!, name: "bridge")
            
            let myConfig = (configuration != nil) ? configuration! : WKWebViewConfiguration()
            myConfig.userContentController = userContentController
            myConfig.preferences.javaScriptCanOpenWindowsAutomatically = true
            
            webViewHolder.appleWebView = WKWebView(frame: .zero, configuration: myConfig)
            webViewHolder.appleWebView!.uiDelegate = webViewHolder.webViewCoordinator
            webViewHolder.appleWebView!.allowsBackForwardNavigationGestures = true
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
            // webView.backgroundColor = UIColor.clear
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

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
        webViewRef?.loadRequestWV?.didLoadChild(loadRequestID: webViewRef!.loadRequestID, webViewID: webViewRef!.webViewID)
        webViewRef?.loadRequestID = -1
        webViewRef?.didFinishLoadPage()
    }
    
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Swift.Void) {
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse, decisionHandler: @escaping (WKNavigationResponsePolicy) -> Swift.Void) {
        decisionHandler(.allow)
    }

    // receive message from wkwebview
    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        let json = JsonParser(str: message.body as? String)
        if let wv = webViewRef {
            wv.onJSScriptMessage(json: json)
        }
    }
    
    func scrollViewDidScroll(_ scrollView: UIScrollView) {
        webViewRef?.scrollOffset = scrollView.contentOffset
        let wg = wgManager.getWindowGroup(windowGroup: webViewRef!.parentWindowGroupId)
        wg.updateFrame = !(wg.updateFrame)
    }
}

struct WebViewNative: UIViewRepresentable {
    weak var webViewRef: SpatialWebView? = nil
    var url: URL = .init(filePath: "/")
    var webViewHolder = WebViewHolder()
    
    init(url: URL) {
        self.url = url
    }
    
    func makeCoordinator() -> Coordinator {
        let c = Coordinator()
        c.webViewRef = webViewRef
        return c
    }
        
    func makeUIView(context: Context) -> WKWebView {
        if webViewHolder.appleWebView == nil {
            webViewHolder.webViewCoordinator = makeCoordinator()
            let userContentController = WKUserContentController()
            
            let userScript = WKUserScript(source: "window.WebSpatailEnabled = true", injectionTime: .atDocumentStart, forMainFrameOnly: false)
            userContentController.addUserScript(userScript)
            userContentController.add(webViewHolder.webViewCoordinator!, name: "bridge")
            
            let configuration = WKWebViewConfiguration()
            configuration.userContentController = userContentController
            
            webViewHolder.appleWebView = WKWebView(frame: .zero, configuration: configuration)
            webViewHolder.appleWebView!.uiDelegate = webViewHolder.webViewCoordinator
            webViewHolder.appleWebView!.allowsBackForwardNavigationGestures = true
            
            webViewHolder.appleWebView!.allowsLinkPreview = true
            webViewHolder.appleWebView!.navigationDelegate = webViewHolder.webViewCoordinator
            webViewHolder.appleWebView!.scrollView.delegate = webViewHolder.webViewCoordinator
            webViewHolder.needsUpdate = true
        }

        return webViewHolder.appleWebView!
    }
        
    func updateUIView(_ webView: WKWebView, context: Context) {
        if webViewHolder.needsUpdate {
            let request = URLRequest(url: url)
            webView.load(request)
            webView.isOpaque = false
            // webView.backgroundColor = UIColor.clear
            webViewHolder.needsUpdate = false
        }
    }
}

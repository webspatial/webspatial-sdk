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
    var gWebView: WKWebView?
}

struct WebViewNative: UIViewRepresentable {
    var webViewRef: WebView? = nil
    let url: URL
    var webViewHolder = WebViewHolder()
    class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler, WKUIDelegate {
        @Environment(\.openWindow) private var openWindow
        @Environment(\.dismissWindow) private var dismissWindow
        @Environment(\.dismiss) private var dismiss
        @Environment(\.openImmersiveSpace) private var openImmersiveSpace
        
        var webView: WKWebView?
        var webViewRef: WebView? = nil
            
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            self.webView = webView
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
            
        func messageToWebview(msg: String) {
            webView?.evaluateJavaScript("webkit.messageHandlers.bridge.onMessage('\(msg)')")
        }
    }
        
    func makeCoordinator() -> Coordinator {
        let c = Coordinator()
        c.webViewRef = webViewRef
        return c
    }
        
    func makeUIView(context: Context) -> WKWebView {
        let coordinator = makeCoordinator()
        let userContentController = WKUserContentController()
        userContentController.add(coordinator, name: "bridge")
            
        let configuration = WKWebViewConfiguration()
        configuration.userContentController = userContentController
            
        if webViewHolder.gWebView == nil {
            webViewHolder.gWebView = WKWebView(frame: .zero, configuration: configuration)
            webViewHolder.gWebView!.uiDelegate = coordinator
            webViewHolder.gWebView!.allowsBackForwardNavigationGestures = true
                
            webViewHolder.gWebView!.allowsLinkPreview = true
//                webView.navigationDelegate = self
            webViewHolder.gWebView!.navigationDelegate = coordinator
            webViewHolder.needsUpdate = true
        }
            
        return webViewHolder.gWebView!
    }
        
    func updateUIView(_ webView: WKWebView, context: Context) {
        if webViewHolder.needsUpdate {
            let request = URLRequest(url: url)
            webView.load(request)
            webView.isOpaque = false
            webViewHolder.needsUpdate = false
        }
    }
}

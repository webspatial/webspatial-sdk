//
//  NativeWebView.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import Foundation

import SwiftUI
import RealityKit
import RealityKitContent


import WebKit
var wgManager = WindowGroupManager()



class WebViewHolder {
    var needsUpdate = false
    var gWebView: WKWebView?
}




struct WebViewNative: UIViewRepresentable {
    var webViewRef:WebView? = nil
    let url: URL
    var webViewHolder = WebViewHolder()
    class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler, WKUIDelegate {
        @Environment(\.openWindow) private var openWindow
        @Environment(\.dismissWindow) private var dismissWindow
        @Environment(\.dismiss) private var dismiss
        @Environment(\.openImmersiveSpace) private var openImmersiveSpace
        
            var webView: WKWebView?
            var webViewRef:WebView? = nil
            
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
                // TODO: Fix access warning: https://stackoverflow.com/questions/65105984/how-can-i-send-events-for-scene-handlesexternaleventsmatching-to-receive
               
                
               // print(message.body)
                let json = JsonParser(str: message.body as? String)
                if let wv = webViewRef {
                    wv.onJSScriptMessage(json: json)
                }
                
//                let date = Date()
//                DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
//                    self.messageToWebview(msg: "hello, I got your messsage: \(message.body) at \(date)")
//                }
//                
//                if let data = x!.data(using: .utf8) {
//                   do {
//                       let json = try JSONSerialization.jsonObject(with: data, options: .mutableContainers) as? [String:AnyObject]
//
//                       if let x:String = getNestedJsonObject(json: json!, lookup: ["command"]) {
//                           print(x)
//                       }
//
//                       if let x:String = getNestedJsonObject(json: json!, lookup: ["data","nested","a"]) {
//                           print(x)
//                       }
//
//                       let commandString = String(describing: json!["command"]!)
//
//                       var s = "";
////                       let x = String(describing:);
////                       print("TREVOR HERE")
////                       print(x)
//                       if(commandString == "createWindowGroup"){
//
//                           if let ws = (json?["data"]?["windowStyle"].flatMap {$0 == nil ? nil : $0!}) {
//
//                               let windowStyle = String(describing: ws)
//                               print("TREVOR HERE")
//                               print(windowStyle)
//                           }
//                           let windowStyle = String(describing: json?["data"]?["windowStyle"])
//                           let name = String(describing: json!["data"]!["name"]!!)
//                           s = name
//                           print(windowStyle)
//                           print(name)
//                       }
//
//
//
//                       let _ = openWindow(id: "Plain", value: WindowGroupData(windowGroupIn: s, windowIdIn: "B", url: URL(string: "http://localhost:5173/index2.html")!));
//                       print("try to open window")
//
//                      // Task {
//                          // try await Task.sleep(nanoseconds: UInt64(4 * Double(NSEC_PER_SEC)));
//                           print("try to create webview")
//                           let _ = wgManager.createWebView(windowGroup: s, windowId: "B", url: URL(string: "http://localhost:5173/index2.html")!)
//
//
//                   } catch {
//                       print("Something went wrong")
//                   }
//               }
                
               
            }
            
            func messageToWebview(msg: String) {
                self.webView?.evaluateJavaScript("webkit.messageHandlers.bridge.onMessage('\(msg)')")
            }
        }
        
        func makeCoordinator() -> Coordinator {
            let c = Coordinator()
            c.webViewRef = webViewRef
            return c;
        }
        
        func makeUIView(context: Context) -> WKWebView {
            let coordinator = makeCoordinator()
            let userContentController = WKUserContentController()
            userContentController.add(coordinator, name: "bridge")
            
            let configuration = WKWebViewConfiguration()
            configuration.userContentController = userContentController
            
           
            
            if(webViewHolder.gWebView == nil){
                webViewHolder.gWebView = WKWebView(frame: .zero, configuration: configuration)
                webViewHolder.gWebView!.uiDelegate = coordinator
                webViewHolder.gWebView!.allowsBackForwardNavigationGestures = true
                
                webViewHolder.gWebView!.allowsLinkPreview = true
//                webView.navigationDelegate = self
                webViewHolder.gWebView!.navigationDelegate = coordinator
                webViewHolder.needsUpdate = true
            }
            
            
            return  webViewHolder.gWebView!
        }
        
        func updateUIView(_ webView: WKWebView, context: Context) {
            if(webViewHolder.needsUpdate){
                let request = URLRequest(url: url)
                webView.load(request)
                webView.isOpaque = false
                webViewHolder.needsUpdate = false
            }
                    
        }
}



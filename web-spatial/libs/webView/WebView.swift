//
//  WebView.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import Foundation
import SwiftUI

struct HelperView : View {
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace
    
    @State var x:Bool = true
    {
        willSet{
            print("willSet: newValue =\(newValue)  oldValue =\(x)")
        }
        didSet{
            print("didSet: oldValue=\(oldValue) newValue=\(x)")
//            Task {
//                await openImmersiveSpace(id: "ImmersiveSpace")
//            }
            //Write code, function do what ever you want todo
        }
    }
    
    var body: some View {
        if(!x){
            VStack {}.onAppear {
                
            }
        }
        
    }
    func callForMe(){
//        Task {
//            await openImmersiveSpace(id: "ImmersiveSpace")
//        }
    }
}


class WebView {
//    @Environment(\.openWindow) private var openWindow
//    @Environment(\.dismissWindow) private var dismissWindow
//    @Environment(\.dismiss) private var dismiss
//    @Environment(\.openImmersiveSpace) private var openImmersiveSpace
//    @Environment(\.dismissImmersiveSpace) var dismissImmersiveSpace
    
    var pose = SIMD3<Float>(0,0,0)
    var hv = HelperView()
    var webView : WebViewNative
    init(url: URL){
        webView = WebViewNative(url: url);
        webView.webViewRef = self
    }
    
    func onJSScriptMessage(json: JsonParser){
        if let command:String = json.getValue(lookup: ["command"]){
            if(command == "createWindowGroup"){
                if let windowStyle:String = json.getValue(lookup: ["data", "windowStyle"]),
                   let name:String = json.getValue(lookup: ["data", "name"]) {
                    
                    let wgd = WindowGroupData(windowStyleIn: windowStyle, windowGroupIn: name, windowIdIn: "B", url: URL(string: "http://localhost:5173/index2.html")!)
                    
                    wgManager.getWindowGroup(windowGroup: "root").openWindowData = wgd;
                }
            }else if(command == "createWebPanel"){
                if let url:String = json.getValue(lookup: ["data", "url"]),
                   let windowGroupId:String = json.getValue(lookup: ["data", "windowGroupId"]),
                   let name:String = json.getValue(lookup: ["data", "name"]) {
                    
                    let _ = wgManager.createWebView(windowGroup:windowGroupId, windowId: name, url: URL(string: url)!);
                    
                    
//                                Task {
//                                    try await Task.sleep(nanoseconds: UInt64(2 * Double(NSEC_PER_SEC)));
//                                    let d = wgManager.getWindowGroup(windowGroup: windowGroupId)
//                                    d.webViews[name]?.pose.x = 0.2
//                                    d.updateFrame = !d.updateFrame
//                                    print("moved")
//                                }
                    
                }
            }else if(command == "updatePanelPose"){
                if let windowGroupId:String = json.getValue(lookup: ["data", "windowGroupId"]),
                   let name:String = json.getValue(lookup: ["data", "name"]),
                   let x:String = json.getValue(lookup: ["data", "x"]){
                    
                    let d = wgManager.getWindowGroup(windowGroup: windowGroupId)
                    d.webViews[name]?.pose.x = (x as NSString).floatValue
                    d.updateFrame = !d.updateFrame
                    
                    
                }
            }else if(command == "createMesh"){
//                if let windowGroupId:String = json.getValue(lookup: ["data", "windowGroupId"]),
//                   let name:String = json.getValue(lookup: ["data", "name"]) {
//   
//                
//                    
//
//                    
//                }
            }else if(command == "openImmersiveSpace"){
//                hv.callForMe()
//                hv.x = false
                print("TREVOR HERE A")
                wgManager.getWindowGroup(windowGroup: "root").x = true
                
            }else if(command == "dismissImmersiveSpace"){
                print("TREVOR HERE B")
                wgManager.getWindowGroup(windowGroup: "root").x = false
            }else if(command == "log"){
                if let logString:String = json.getValue(lookup: ["data", "logString"]) {
                    print(logString)
                }
            }
        }
    }
}

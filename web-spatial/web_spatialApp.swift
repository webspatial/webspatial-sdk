//
//  web_spatialApp.swift
//  web-spatial
//
//  Created by ByteDance on 5/8/24.
//

import SwiftUI
import typealias RealityKit.RealityView
import typealias RealityKit.Entity
import typealias RealityKit.Attachment
import typealias RealityKit.Model3D
import typealias RealityKit.MeshResource
import typealias RealityKit.SimpleMaterial
import typealias RealityKit.ModelEntity


struct WindowGroupData : Decodable, Hashable, Encodable {
    let windowStyle : String
    let windowGroup : String
    let windowId : String
    
    init(windowStyleIn:String, windowGroupIn: String, windowIdIn: String, url: URL){
        windowGroup = windowGroupIn
        windowId = windowIdIn
        windowStyle = windowStyleIn
        //let _ = wgManager.createWebView(windowGroup: windowGroup, windowId: windowId, url: url)
    }
}


@main
struct web_spatialApp: App {
    
    var root : WebView
    var rootWGD : WindowGroupContentDictionary
    
    init(){
        print("WebSpatial App Started --------")
        
        root  = wgManager.createWebView(windowGroup:"root", windowId: "root", url: URL(string: "http://localhost:5173")!);
        rootWGD = wgManager.getWindowGroup(windowGroup: "root")
        
    }
    
    
    var body: some Scene {
        WindowGroup(id: "Plain", for: WindowGroupData.self) { $windowData in
            if(windowData == nil){
                PlainWindowGroupView(windowGroupContent: rootWGD)
            }else{
                let wg = wgManager.getWindowGroup(windowGroup: windowData!.windowGroup)
                PlainWindowGroupView(windowGroupContent: wg)
            }
            
        }
        
        WindowGroup(id: "Volumetric", for: WindowGroupData.self) { $windowData in
            let wg = wgManager.getWindowGroup(windowGroup: windowData!.windowGroup)
            VolumetricWindowGroupView(windowGroupContent: wg)
            
        }.windowStyle(.volumetric).defaultSize(width: 1, height: 1, depth: 1, in: .meters)

        ImmersiveSpace(id: "ImmersiveSpace") {
            ImmersiveView()
        }
    }
}

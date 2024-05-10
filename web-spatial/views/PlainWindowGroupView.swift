//
//  PlainWindowGroupView.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import SwiftUI

struct PlainWindowGroupView : View {
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace
    @Environment(\.openWindow) private var openWindow
    @ObservedObject var windowGroupContent : WindowGroupContentDictionary

    
    var body: some View {
        VStack {}.onAppear().onReceive( windowGroupContent.$x.dropFirst()) { v in
            if(v){
                Task {
                    await openImmersiveSpace(id: "ImmersiveSpace")
                }
            }else{
                Task {
                   await dismissImmersiveSpace()
                }
            }
                       
        }.onReceive( windowGroupContent.$openWindowData.dropFirst()) { wd in
            print("TREVOR RECEIVEWD")
            let _ = openWindow(id: wd!.windowStyle, value: wd!);
        }
        
        ForEach(Array(windowGroupContent.webViews.keys), id: \.self){ key in
            windowGroupContent.webViews[key]?.webView
        }
    }
}

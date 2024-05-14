//
//  PlainWindowGroupView.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import typealias RealityKit.Model3D
import SwiftUI

struct PlainWindowGroupView: View {
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace
    @Environment(\.openWindow) private var openWindow
    @ObservedObject var windowGroupContent: WindowGroupContentDictionary

    var body: some View {
        VStack {}.onAppear().onReceive(windowGroupContent.$x.dropFirst()) { v in
            if v {
                Task {
                    await openImmersiveSpace(id: "ImmersiveSpace")
                }
            } else {
                Task {
                    await dismissImmersiveSpace()
                }
            }

        }.onReceive(windowGroupContent.$openWindowData.dropFirst()) { wd in
            let _ = openWindow(id: wd!.windowStyle, value: wd!)
        }

        GeometryReader { _ in
            ZStack {
                VStack {
                    ForEach(Array(windowGroupContent.webViews.keys), id: \.self) { key in
                        windowGroupContent.webViews[key]?.webView
                    }
                }
                ForEach(Array(windowGroupContent.models.keys), id: \.self) { key in
                    Model3D(url: windowGroupContent.models[key]!.url) { model in
                        model.model?
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                    }.frame(width: 50, height: 100).position(x: CGFloat(windowGroupContent.models[key]!.position.x), y: CGFloat(windowGroupContent.models[key]!.position.y)).offset(z: CGFloat(windowGroupContent.models[key]!.position.z)).padding3D(.front, -100000)
                }
            }
        }
    }
}

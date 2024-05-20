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

        GeometryReader { proxy3D in
            ZStack {
                let oval = Float(windowGroupContent.webViews["root"]!.scrollOffset.y)
                ForEach(Array(windowGroupContent.webViews.keys), id: \.self) { key in
                    let view = windowGroupContent.webViews[key]!

                    let x = view.full ? (proxy3D.size.width/2) : CGFloat(view.pose.x)
                    let y = view.full ? (proxy3D.size.height/2) : CGFloat(view.pose.y - oval)
                    let z = CGFloat(view.pose.z)
                    let width = view.full ? (proxy3D.size.width) : CGFloat(view.width)
                    let height = view.full ? (proxy3D.size.height) : CGFloat(view.height)

                    view.webView
                        .frame(width: width, height: height).padding3D(.front, -100000) // .padding3D(.all, -100000)
                        //                        .hoverEffect(.automatic, isEnabled: true)
                        .cornerRadius(24)
                        .shadow(radius: 20)
                        .position(x: x, y: y)
                        .offset(z: z).refreshable {}
                        .opacity(windowGroupContent.resizing ? 0 : 1)
                    // .allowsHitTesting(key == "root")
                }
                ForEach(Array(windowGroupContent.models.keys), id: \.self) { key in
                    Model3D(url: windowGroupContent.models[key]!.url) { model in
                        model.model?
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                    }.frame(width: 50, height: 100).position(x: CGFloat(windowGroupContent.models[key]!.position.x), y: CGFloat(windowGroupContent.models[key]!.position.y - oval)).offset(z: CGFloat(windowGroupContent.models[key]!.position.z)).padding3D(.front, -100000).opacity(windowGroupContent.resizing ? 0 : 1)
                }
            }.onChange(of: proxy3D.size) { _ in
                windowGroupContent.resizing = true
            }
        }
    }
}

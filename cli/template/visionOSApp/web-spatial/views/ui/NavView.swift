//
//  NavView.swift
//  web-spatial
//
//  Created by ByteDance on 2025/1/8.
//

import SwiftUI
import WebKit

struct NavView: View {
    @State var swc: SpatialWindowComponent?
    @State var showUrl: Bool = true
    @State private var showCopyTip = false
    @State private var navWidth: CGFloat = 0
    @State private var navHeight: CGFloat = 0
    @State private var texWidth: CGFloat = 0
    @State private var firstGetSize: Bool = true

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            ZStack {}.frame(width: navWidth, height: navHeight)
            VStack(alignment: .trailing, spacing: 5) {
                if showUrl {
                    Text(pwaManager.name).padding(10)
                    if pwaManager.display == .minimal {
                        HStack(spacing: 5) {
                            Button(action: {
                                swc?.goBack()
                            }, label: {
                                Image(systemName: "arrow.left")
                            })
                            .disabled(!(swc?.canGoBack ?? false))
                            Button(action: {
                                swc?.goForward()
                            }, label: {
                                Image(systemName: "arrow.right")
                            })
                            .disabled(!(swc?.canGoBack ?? false))
                            Button(action: {
                                swc?.reload()
                            }, label: {
                                Image(systemName: "arrow.clockwise")
                            })
                            Button(
                                action: {
                                    swc?
                                        .navigateToURL(
                                            url: URL(string: pwaManager.start_url)!
                                        )
                                },
                                label: {
                                    Image(systemName: "house.fill")
                                }
                            )
                        }
                    }
                }
                HStack(spacing: 5) {
                    if showUrl {
                        Text(
                            swc?.getURL()?.absoluteString ?? "http://localhost:5173/"
                        )
                        .padding()
                        .lineLimit(1)
                        .overlay(GeometryReader { geo -> AnyView in
                            DispatchQueue.main.async {
                                if geo.size.width > 0 {
                                    texWidth = .minimum(300, geo.size.width)
                                }
                            }
                            return AnyView(EmptyView())
                        })
                        .frame(width: texWidth == 0 ? .infinity : texWidth)
                        Button(action: {
                            UIPasteboard.general.string = swc?.getURL()?.absoluteString ?? ""
                            showCopyTip = true
                            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                                showCopyTip = false
                            }
                        }, label: {
                            Text("copy")
                        })
                    }

                    Button(action: {
                        withAnimation(.easeInOut(duration: 0.5)) {
                            showUrl.toggle()
                        }
                    }, label: {
                        Image(systemName: showUrl ? "xmark" : "info")
                    })
                }
            }
            .padding()
            .glassBackgroundEffect(in: RoundedRectangle(cornerRadius: 15))
            .popover(isPresented: $showCopyTip) {
                Text("copied！")
                    .padding()
                    .cornerRadius(10)
            }
            .overlay(GeometryReader { geo -> AnyView in
                DispatchQueue.main.async {
                    if firstGetSize {
                        navWidth = geo.size.width
                        navHeight = geo.size.height
                        firstGetSize.toggle()
                        showUrl.toggle()
                        print(navWidth)
                    }
                }
                return AnyView(EmptyView())
            })
            .opacity(firstGetSize ? 0 : 1)
        }
        .frame(width: firstGetSize ? .infinity : navWidth, height: firstGetSize ? .infinity : navHeight)
        .offset(z: 30)
    }
}

struct NavView_Previews: PreviewProvider {
    static var previews: some View {
        NavView()
    }
}

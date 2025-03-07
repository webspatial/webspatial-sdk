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
    @State var showUrl: Bool = false
    @State private var showCopyTip = false
    @State private var nowHover = false
    @State private var navWidth: CGFloat = 0

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            HStack(spacing: 5) {
                Text(pwaManager.name).padding(.trailing, 10)
                if pwaManager.display == .minimal {
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
                Button(action: {
                    showUrl.toggle()
                }, label: {
                    Image(systemName: "info.circle")
                })
            }.overlay(GeometryReader { geo -> AnyView in
                DispatchQueue.main.async {
                    navWidth = geo.size.width
                    print(navWidth)
                }
                return AnyView(EmptyView())
            })
            .hoverEffect { effect, isHover, body in
                effect.clipShape(getMaskPath(rect: CGRect(x: isHover || showUrl ? 0 : body.size.width - 65, y: 0, width: body.size.width, height: body.size.height)))
//                effect.clipShape(.rect.size(width: isHover || showUrl ? 0 : body.size.width - 65, height: body.size.height))
            }
            .gesture(SpatialTapGesture().onEnded { evt in
                let rangeX = navWidth - evt.location.x
                if rangeX < 60 {
                    showUrl.toggle()
                } else if rangeX >= 74, rangeX <= 140 {
                    swc?
                        .navigateToURL(
                            url: URL(string: pwaManager.start_url)!
                        )
                } else if rangeX >= 150, rangeX <= 210 {
                    swc?.reload()
                } else if rangeX >= 221, rangeX <= 281 {
                    swc?.goForward()
                } else if rangeX >= 294, rangeX <= 355 {
                    swc?.goBack()
                }
            })
            HStack(spacing: 5) {
                Text(
                    swc?.getURL()?.absoluteString ?? ""
                )
                .frame(maxWidth: navWidth)
                .padding()
                Button(action: {
                    UIPasteboard.general.string = swc?.getURL()?.absoluteString ?? ""
                    showCopyTip = true
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                        showCopyTip = false
                    }
                }, label: {
                    Text("copy")
                })

                Button(action: {
                    showUrl = false
                }, label: {
                    Text("X")
                })
            }.glassBackgroundEffect(in: .rect).cornerRadius(15).offset(y: 0).opacity(showUrl ? 1 : 0).animation(.easeOut, value: 0.2)
        }
        .zIndex(10) // closer to user
        .popover(isPresented: $showCopyTip) {
            Text("copied！")
                .padding()
                .cornerRadius(10)
//                .background(.ultraThinMaterial)
        }
    }

    func getMaskPath(rect: CGRect) -> Path {
        var path = Path()
        path.addRoundedRect(in: rect, cornerSize: CGSize(width: 15, height: 15))
        return path
    }
}

// struct NavView_Previews: PreviewProvider {
//    static var previews: some View {
//        NavView()
//    }
// }

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

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            VStack(alignment: .trailing, spacing: 0) {
                HStack(spacing: 10) {
                    Text(pwaManager.name).padding(.trailing, 10)
                    if pwaManager.display == .minimal {
                        Button(action: {
                            swc?.goBack()
                        }, label: {
                            Text("←")
                        })
                        .disabled(!swc!.canGoBack)
                        Button(action: {
                            swc?.goForward()
                        }, label: {
                            Text("→")
                        })
                        .disabled(!swc!.canGoForward)
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
                }
            }.padding().glassBackgroundEffect(in: .rect).cornerRadius(15)
            HStack(spacing: 0) {
                Text(
                    swc?.getURL()?.absoluteString ?? ""
                )
                .padding() // (wv?.url?.absoluteString)
                Button(action: {
                    UIPasteboard.general.string = swc?.getURL()?.absoluteString ?? ""
                    showCopyTip = true
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                        showCopyTip = false
                    }
                }, label: {
                    Text("copy")
                }).padding(.trailing, 5)

                Button(action: {
                    showUrl = false
                }, label: {
                    Text("X")
                })
            }.glassBackgroundEffect(in: .rect).cornerRadius(15).offset(y: 35).opacity(showUrl ? 1 : 0).animation(.easeOut(duration: 0.2))
        }
        .zIndex(10) // closer to user
        .popover(isPresented: $showCopyTip) {
            Text("copied！")
                .padding()
                .background(.ultraThinMaterial)
                .cornerRadius(10)
        }
    }
}

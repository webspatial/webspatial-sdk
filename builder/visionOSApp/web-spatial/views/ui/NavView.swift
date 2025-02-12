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
    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            VStack(alignment: .trailing, spacing: 0) {
                HStack(spacing: 10) {
                    Text(pwaManager.name).padding(.trailing, 10)
                    if pwaManager.display == .minimal {
                        Button(action: {
                            print("click back")
                            swc?.goBack()
                        }, label: {
                            Text("←")
                        })
                        Button(action: {
                            print("click forward")
                            swc?.goForward()
                        }, label: {
                            Text("→")
                        })
                        Button(action: {
                            print("click reset")
                            swc?.reload()
                        }, label: {
                            Text("○")
                        })
                        Button(action: {
                            print("click home")
                        }, label: {
                            Text("H")
                        })
                    }
                    Button(action: {
                        print("click info")
                        showUrl.toggle()
                    }, label: {
                        Text("!")
                    })
                }
            }.padding().glassBackgroundEffect(in: .rect).cornerRadius(15)
            HStack(spacing: 0) {
                Text(
                    swc?.getURL()?.absoluteString ?? ""
                )
                .padding() // (wv?.url?.absoluteString)
                Button(action: {
                    print("click copy")
                }, label: {
                    Text("copy")
                }).padding(.trailing, 5)
                Button(action: {
                    print("click close")
                    showUrl = false
                }, label: {
                    Text("X")
                })
            }.glassBackgroundEffect(in: .rect).cornerRadius(15).offset(y: 35).opacity(showUrl ? 1 : 0).animation(.easeOut(duration: 0.2))
        }
        .zIndex(10) // closer to user
    }
}

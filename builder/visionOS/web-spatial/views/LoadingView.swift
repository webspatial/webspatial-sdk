//
//  LoadingView.swift
//  web-spatial
//
//  Created by ByteDance on 2025/1/24.
//

import SwiftUI
import SwiftUICore

struct LoadingView: View {
    var body: some View {
        GeometryReader { proxy3D in
            let width = proxy3D.size.width
            let height = proxy3D.size.height
            ZStack {
                VStack {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(2)
                    Text("Loading...")
                        .foregroundColor(.white)
                        .font(.headline)
                        .padding(.top, 16)
                }
            }.frame(width: width, height: height).glassBackgroundEffect()
        }
    }
}

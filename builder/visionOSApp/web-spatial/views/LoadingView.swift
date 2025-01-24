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
        ZStack {
            Color.black.opacity(0.8)
                .ignoresSafeArea()
            VStack {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    .scaleEffect(2)
                Text("Loading...")
                    .foregroundColor(.white)
                    .font(.headline)
                    .padding(.top, 16)
            }
        }
    }
}

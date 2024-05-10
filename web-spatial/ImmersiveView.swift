//
//  ImmersiveView.swift
//  web-spatial
//
//  Created by ByteDance on 5/8/24.
//

import RealityKit
import RealityKitContent
import SwiftUI

struct ImmersiveView: View {
    var body: some View {
        RealityView { content in
            if let scene = try? await Entity(named: "Immersive", in: realityKitContentBundle) {
                content.add(scene)
            }
        }
    }
}

#Preview(immersionStyle: .mixed) {
    ImmersiveView()
}

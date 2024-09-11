//
//  OpenDismissHandlerUI.swift
//  web-spatial
//
//  Created by ByteDance on 8/20/24.
//

import SwiftUI

struct OpenDismissHandlerUI: View {
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace
    @Environment(\.openWindow) private var openWindow
    @Environment(\.dismissWindow) private var dismissWindow

    @Environment(SpatialWindowGroup.self) var windowGroupContent: SpatialWindowGroup

    var body: some View {
        VStack {}
            .onAppear()
            .onReceive(windowGroupContent.toggleImmersiveSpace) { v in
                if v {
                    Task {
                        await openImmersiveSpace(id: "ImmersiveSpace")
                    }
                } else {
                    Task {
                        await dismissImmersiveSpace()
                    }
                }
            }
            .onReceive(windowGroupContent.openWindowData) { wd in
                let _ = openWindow(id: wd.windowStyle, value: wd)
            }
            .onReceive(windowGroupContent.closeWindowData) { wd in
                dismissWindow(id: wd.windowStyle, value: wd)
            }
    }
}

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

    @Environment(SpatialWindowContainer.self) var windowContainerContent: SpatialWindowContainer

    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        VStack {}
            .onAppear()
            .onReceive(windowContainerContent.toggleImmersiveSpace) { v in
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
            .onReceive(windowContainerContent.openWindowData) { wd in
                let _ = openWindow(id: wd.windowStyle, value: wd)
            }
            .onReceive(windowContainerContent.closeWindowData) { wd in
                dismissWindow(id: wd.windowStyle, value: wd)
            }
            .onReceive(windowContainerContent.setLoadingWindowData) { wd in
                if wd.method == .show {
                    openWindow(id: "loading")
                } else if wd.method == .hide {
                    dismissWindow(id: "loading")
                }
            }

            .onChange(of: scenePhase) { oldValue, newValue in
                print("OpenDismissHandlerUI: Value changed from \(oldValue) to \(newValue)")
                if newValue == .background {
//                    windowContainerContent.destroy()
                }
            }
    }
}

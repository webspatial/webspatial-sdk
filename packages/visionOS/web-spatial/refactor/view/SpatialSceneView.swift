import SwiftUI

struct SpatialSceneView: View {
    var sceneId: String
    @State private var windowResizeInProgress = false
    @State private var timer: Timer?

    var body: some View {
        GeometryReader { proxy3D in
            let width = proxy3D.size.width
            let height = proxy3D.size.height

            SceneHandlerUIView(sceneId: sceneId).onChange(of: proxy3D.size) {
                windowResizeInProgress = true
                if timer != nil {
                    timer!.invalidate()
                }
                // If we don't detect resolution change after x seconds we treat the resize as complete
                timer = Timer.scheduledTimer(withTimeInterval: 0.2, repeats: false) { _ in
                    windowResizeInProgress = false
                    timer = nil
                }
            }

            if windowResizeInProgress {
                let x = width / 2
                let y = height / 2
                VStack {}.frame(width: width, height: height).glassBackgroundEffect().padding3D(.front, -100_000)
                    .position(x: x, y: y)
            } else {
                SpatialSceneRootWebView(sceneId: sceneId, width: width, height: height)
            }
        }
    }
}

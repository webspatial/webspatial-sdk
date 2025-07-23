import Foundation

@Observable
class SpatialApp {
    var name: String
    var scope: String
    var displayMode: PWADisplayMode
    var version: String
    var startURL: String

    init() {
        name = pwaManager.name
        scope = pwaManager.scope
        displayMode = pwaManager.display
        version = pwaManager.getVersion()
        startURL = pwaManager.start_url

        bootstrap()
    }

    func bootstrap() {
        // init global logger
        Logger.initLogger()

        // init pwa manager
        pwaManager._init()
        logger.debug("WebSpatial App Started -------- rootURL: " + startURL)
    }

    func createRootScene() {
        let wgd = SceneData(
            windowStyle: "Plain",
            sceneID: SpatialSceneX.getRootID()
        )
        _ = SpatialSceneX(SpatialSceneX.getRootID(), startURL, wgd)
    }
}

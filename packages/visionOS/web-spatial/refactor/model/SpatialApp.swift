import Foundation

class SpatialApp {
    // TODO: read only
    var name: String
    var scope: String
    var displayMode: PWADisplayMode
    var version: String
    var startURL: String

    static let Instance: SpatialApp = .init()

    init() {
        // init pwa manager
        pwaManager._init()
        name = pwaManager.name
        scope = pwaManager.scope
        displayMode = pwaManager.display
        version = pwaManager.getVersion()
        startURL = pwaManager.start_url

        Logger.initLogger()

        logger.debug("WebSpatial App Started -------- rootURL: " + startURL)

//        setToMainSceneCfg()
    }

    func createScene(_ url: String, _ style: String, _ state: SpatialScene.SceneStateKind) -> SpatialScene {
        let newScene = SpatialSceneManager.Instance.create(
            url,
            style,
            state
        )

        return newScene
    }

    func getScene(_ name: String) -> SpatialScene? {
        return SpatialSceneManager.Instance.getScene(name)
    }

    // TODO: inspect scene
}

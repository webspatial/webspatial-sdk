import Foundation

@Observable
class SpatialApp {
    // TODO: read only
    var name: String
    var scope: String
    var displayMode: PWADisplayMode
    var version: String
    var startURL: String

    init() {
        // init pwa manager
        pwaManager._init()
        name = pwaManager.name
        scope = pwaManager.scope
        displayMode = pwaManager.display
        version = pwaManager.getVersion()
        startURL = pwaManager.start_url

        bootstrap()
//        createRootScene()
    }

    private func bootstrap() {
        // init global logger
        Logger.initLogger()

        logger.debug("WebSpatial App Started -------- rootURL: " + startURL)
    }

    static func createScene(_ url: String) -> SpatialScene {
        let newScene = SpatialSceneManager.Instance.create(
            url,
            "Plain"
        )

        DispatchQueue.main.async {
            newScene.spatialWebViewModel.evaluateJS(js: "window._webSpatialID = '" + newScene.id + "'")
        }

        return newScene
    }

    static func getScene(_ name: String) -> SpatialScene? {
        return SpatialSceneManager.Instance.getScene(name)
    }

    // TODO: inspect scene
}

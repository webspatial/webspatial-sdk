import Foundation

@Observable
class SpatialAppX {
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

    static func createScene(_ url: String) -> SpatialSceneX {
        // TODO: 让SpatialAPP createScene
        print("url,", url)
        let newScene = SpatialSceneX(url, "Plain")

        // TODO: 下沉到model
        DispatchQueue.main.async {
            newScene.spatialWebviewModel!.evaluateJS(js: "window._webSpatialID = '" + newScene.id + "'")
        }

        return newScene
    }

    static func getScene(_ name: String) -> SpatialSceneX? {
        return SpatialObject.get(name) as? SpatialSceneX
    }

    // TODO: inspect scene
}

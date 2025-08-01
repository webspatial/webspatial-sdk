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

    // move from WindowContainerMgr
    private var memorizedMainSceneConfig: ScenePlainDefaultValues?

//    private var wgSetting: ScenePlainDefaultValues = .init(
//        defaultSize: CGSize(width: 1080, height: 720 + (pwaManager.display != .fullscreen ? NavView.navHeight : 0)),
//        windowResizability: .automatic,
//        resizeRange: nil
//    )

//    func getValue() -> ScenePlainDefaultValues {
//        return wgSetting
//    }

//    private func setToMainSceneCfg() {
//        if let cfg = memorizedMainSceneConfig != nil ? memorizedMainSceneConfig : WindowContainerPlainDefaultValues(pwaManager.mainScene) {
//            updateWindowContainerPlainDefaultValues(cfg)
//        }
//    }

    func updateWindowContainerPlainDefaultValues(_ data: ScenePlainDefaultValues) {
//        if var newSize = data.defaultSize {
//            newSize.height += (pwaManager.display != .fullscreen ? NavView.navHeight : 0)
//            wgSetting.defaultSize = newSize
//        }
//        if let newResizability = data.windowResizability {
//            wgSetting.windowResizability = newResizability
//        }
//        if let newResizeRange = data.resizeRange {
//            wgSetting.resizeRange = newResizeRange
//        }
    }
}

import Foundation

class SceneManager {
    private var sceneMap: [String: SpatialScene] = [:] // windowContainerID -> scene
    static let Instance = SceneManager()

    private init() {}

    func addScene(_ scene: SpatialScene) {
        sceneMap[scene.windowContainerID] = scene
        print("sceneMap:", sceneMap)
    }

    func getScene(_ windowContainerID: String) -> SpatialScene? {
        return sceneMap[windowContainerID]
    }

    func delScene(_ windowContainerID: String) {
        sceneMap[windowContainerID] = nil // TODO: lazy delete?
    }

    // create scene
    // if config is provided, it show immediately
    // else it won't show until showRoot is called
    func createScene(target: SpatialWindowComponent, windowID: String, config: WindowContainerOptions? = nil) {
        if let curScene = SceneManager.Instance.getScene(
            target.parentWindowContainerID
        ) {
            let scene = SpatialScene(
                config: config,
                parent: curScene,
                windowID: windowID
            )

            SceneManager.Instance.addScene(scene)
        }
    }

    // set defaultvalues for the scene and show it
    func showScene(target: SpatialWindowComponent, config: WindowContainerOptions, windowContainerID: String) {
        if let scene = SceneManager.Instance.getScene(
            windowContainerID
        ) {
            scene.show(config: config)
        }
    }

    // bring the scene to focus
    func focusScene(target: SpatialWindowComponent, windowContainerID: String) {
        if let scene = SceneManager.Instance.getScene(
            windowContainerID
        ) {
            scene.focus()
        }
    }

    // show LodingView when window.xrCurrentSceneDefaults is executing
    func setLoading(_ method: LoadingMethod, swc: SpatialWindowComponent) {
        // trigger open loading view by parent windowContainer due to current windowContainer isn't visible yet

        if let curScene = getScene(swc.parentWindowContainerID),
           let parentWindowContainerID = curScene.parent?.windowContainerID,
           let wg = SpatialWindowContainer.getSpatialWindowContainer(
               parentWindowContainerID
           )
        {
            let lwgdata = LoadingWindowContainerData(
                method: method,
                windowStyle: nil
            )
            wg.setLoadingWindowData.send(lwgdata)
        }
    }

    // dismiss the scene content when webview closed
    func closeScene(_ swc: SpatialWindowComponent) {
        if let scene = SceneManager.Instance.getScene(
            swc.parentWindowContainerID
        ) {
            scene.close()
        }
    }
}

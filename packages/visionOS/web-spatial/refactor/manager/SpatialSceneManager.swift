class SpatialSceneManager {
    static let Instance: SpatialSceneManager = .init()
    private var map = [String: SpatialScene]()

    func create(_ url: String, _ style: String, _ state: SpatialScene.SceneStateKind) -> SpatialScene {
        let scene = SpatialScene(url, style, state)
        map[scene.id] = scene
        return scene
    }

    func getScene(_ id: String) -> SpatialScene? {
        return map[id]
    }
}

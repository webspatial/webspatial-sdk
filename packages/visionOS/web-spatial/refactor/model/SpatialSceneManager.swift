class SpatialSceneManager {
    static let Instance: SpatialSceneManager = .init()
    private var map = [String: SpatialScene]()

    func create(_ url: String) -> SpatialScene {
        let scene = SpatialScene(url)
        map[scene.id] = scene
        return scene
    }

    func getScene(_ id: String) -> SpatialScene? {
        return map[id]
    }
}

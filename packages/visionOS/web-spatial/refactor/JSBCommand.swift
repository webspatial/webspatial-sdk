class UpdateSpatialSceneMaterialCommand: CommandDataProtocol {
    static let commandType: String = "updateSpatialSceneMaterial"
    let material: BackgroundMaterial
}

class UpdateSpatialSceneCorerCommand: CommandDataProtocol {
    static let commandType: String = "updateSpatialSceneCorner"
    let cornerRadius: CornerRadius
}

class PingCommand: CommandDataProtocol {
    static let commandType: String = "ping"
}

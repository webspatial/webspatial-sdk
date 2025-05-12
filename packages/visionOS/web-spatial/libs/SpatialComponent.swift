import Foundation

class SpatialComponent: SpatialObject {
    weak var entity: SpatialEntity? = nil

    func onAddToEntity() {}

    override func onDestroy() {
        entity = nil
    }

    override func inspect() -> [String: Any] {
        var inspectInfo: [String: Any] = [
            "entity": entity == nil ? "invalid" : entity!.id,
            "type": String(describing: type(of: self)),
        ]

        let baseInspectInfo = super.inspect()
        for (key, value) in baseInspectInfo {
            inspectInfo[key] = value
        }
        return inspectInfo
    }
}

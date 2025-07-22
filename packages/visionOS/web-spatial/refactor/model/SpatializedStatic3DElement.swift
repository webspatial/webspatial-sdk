
import Foundation

@Observable
class SpatializedStatic3DElement: SpatializedElement {
    var modelURL: String = ""

    override func inspect() -> [String: Any] {
        var inspectInfo: [String: Any] = [
            "modelURL": modelURL,
        ]

        let baseInspectInfo = super.inspect()
        for (key, value) in baseInspectInfo {
            inspectInfo[key] = value
        }
        return inspectInfo
    }
}

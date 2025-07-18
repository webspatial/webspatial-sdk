import SwiftUI

// THIS IS A FAKE MODULE

@Observable
class SpatialWebviewModel {
    var url: String
    init(url: String) {
        self.url = url
    }

    func getView() -> AnyView {
        AnyView(
            Text("hehe")
        )
    }

    func onCallBack(_ name: String, _ func: (Any) -> Void) {}

    func addJSBListener(_ name: String, _ func: (Any) -> Void) {}

    func addProtocalListener(_ name: String, _ func: (Any) -> Void) {}
}

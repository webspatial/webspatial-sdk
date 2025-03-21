import Foundation
import SwiftUI

// Access window (https://stackoverflow.com/questions/60359808/how-to-access-own-window-within-swiftui-view/60359809#60359809)
class SceneDelegate: NSObject, ObservableObject, UIWindowSceneDelegate {
    var window: UIWindow? // << contract of `UIWindowSceneDelegate`

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        window = windowScene.keyWindow // << store !!!
    }

    // do memory cleanup after scene removed, otherwise windowContainer cannot destroy content after being dismissed
    func sceneDidDisconnect(_ scene: UIScene) {
        window = nil
    }
}

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let configuration = UISceneConfiguration(name: nil, sessionRole: connectingSceneSession.role)
        if connectingSceneSession.role == .windowApplication {
            configuration.delegateClass = SceneDelegate.self
        }
        return configuration
    }
}

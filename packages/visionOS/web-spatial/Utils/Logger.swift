import Foundation

class Logger {
    static func getLogger() -> Logger {
        return Logger()
    }

    static func initLogger() {}

    func error(_ str: String) {
        print("error: " + str)
    }

    func verbose(_ str: String) {
        print("verbose: " + str)
    }

    func debug(_ str: String) {
        print("debug: " + str)
    }

    func info(_ str: String) {
        print("info: " + str)
    }

    func warning(_ str: String) {
        print("warning: " + str)
    }
}

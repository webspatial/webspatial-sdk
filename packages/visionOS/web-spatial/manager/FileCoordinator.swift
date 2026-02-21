import Foundation

actor FileCoordinator {
    static let shared = FileCoordinator()

    func moveReplacingIfExists(from sourceURL: URL, to destinationURL: URL) throws {
        let fm = FileManager.default
        if fm.fileExists(atPath: destinationURL.path) {
            try fm.removeItem(at: destinationURL)
        }
        try fm.moveItem(at: sourceURL, to: destinationURL)
    }

    func removeIfExists(at url: URL) throws {
        let fm = FileManager.default
        if fm.fileExists(atPath: url.path) {
            try fm.removeItem(at: url)
        }
    }
}

import Foundation

struct PackageJSON: Codable {
    let version: String
}

func getPackageVersion() -> String {
    let currentFileURL = URL(fileURLWithPath: #file) // path of version
    let currentDirectoryURL = currentFileURL.deletingLastPathComponent()

    let packageJSONURL = currentDirectoryURL
        .deletingLastPathComponent()
        .deletingLastPathComponent()
        .deletingLastPathComponent() // .. project root
        .appendingPathComponent("package.json")

    do {
        // read file
        let data = try Data(contentsOf: packageJSONURL)
        let package = try JSONDecoder().decode(PackageJSON.self, from: data)
        return package.version
    } catch {
        fatalError("⚠️ Error reading package.json at \(packageJSONURL.path): \(error)")
    }
}

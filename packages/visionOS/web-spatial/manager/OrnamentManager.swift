import Foundation
import Observation

@Observable
class OrnamentManager {
    var ornaments: [String: OrnamentElement] = [:]
    var activeIds: [String] = []

    var activeOrnaments: [OrnamentElement] {
        activeIds.compactMap { ornaments[$0] }
    }

    func register(_ ornament: OrnamentElement) {
        ornaments[ornament.id] = ornament
    }

    func add(id: String) -> Bool {
        guard ornaments[id] != nil else { return false }
        if !activeIds.contains(id) {
            activeIds.append(id)
        }
        return true
    }

    func get(id: String) -> OrnamentElement? {
        ornaments[id]
    }

    func update(id: String, options: OrnamentOptions) -> Bool {
        guard let ornament = ornaments[id] else { return false }
        ornament.update(options)
        return true
    }

    func remove(id: String) {
        activeIds.removeAll { $0 == id }
        if let ornament = ornaments.removeValue(forKey: id) {
            ornament.destroy()
        }
    }

    func destroyAll() {
        let toDestroy = Array(ornaments.values)
        activeIds.removeAll()
        ornaments.removeAll()
        for ornament in toDestroy {
            ornament.destroy()
        }
    }
}

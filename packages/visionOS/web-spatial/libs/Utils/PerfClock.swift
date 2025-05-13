import SwiftUI

struct PerfStats: Codable {
    // Time from app start until the first call to setMaterial. In milliseconds
    var firstBackgroundSet: Int = 0

    // Attempts to track the number of commands handled over the last second
    var commandCounter: Int = 0
    var commandCounterStartTime: Int = 0
    var commandsPerSecond = 0.0
}

class PerfClock {
    var perfStats = PerfStats()

    let createTimeMS: Int

    init() {
        createTimeMS = PerfClock.getCurrentTimeMS()
        perfStats.commandCounterStartTime = createTimeMS
    }

    func backgroundSet() {
        if perfStats.firstBackgroundSet == 0 {
            perfStats.firstBackgroundSet = PerfClock.getCurrentTimeMS() - createTimeMS
        }
    }

    func onMessage() {
        perfStats.commandCounter += 1
        let dt = PerfClock.getCurrentTimeMS() - createTimeMS
        if dt > 1000 {
            perfStats.commandsPerSecond = Double(perfStats.commandCounter) / (Double(1000.0) / Double(dt))

            perfStats.commandCounter = 0
            perfStats.commandCounterStartTime = PerfClock.getCurrentTimeMS()
        }
    }

    static func getCurrentTimeMS() -> Int {
        return Int(Date().timeIntervalSince1970 * 1000)
    }
}

//
//  Logger.swift
//  web-spatial
//
//  Created by ByteDance on 7/18/24.
//

import Foundation
import SwiftyBeaver

enum Logger {
    static func getLogger() -> SwiftyBeaver.Type {
        return SwiftyBeaver.self
    }

    static func initLogger() {
        let logConsole = ConsoleDestination()
        logConsole.useTerminalColors = true
        SwiftyBeaver.addDestination(logConsole)
    }
}

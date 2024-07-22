//
//  Logger.swift
//  web-spatial
//
//  Created by ByteDance on 7/18/24.
//

import Foundation
import SwiftyBeaver

struct Logger {
    static func getLogger() -> SwiftyBeaver.Type {
        return SwiftyBeaver.self;
    }
    
    static func initLogger(){
        var logConsole = ConsoleDestination();
        logConsole.useTerminalColors = true;
        SwiftyBeaver.self.addDestination(logConsole)
    }
}

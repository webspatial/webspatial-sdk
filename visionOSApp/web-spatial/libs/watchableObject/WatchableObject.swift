//
//  WatchableObject.swift
//  web-spatial
//
//  Created by ByteDance on 6/17/24.
//

import Foundation
import SwiftUI

class WatchableObject: ObservableObject {}

// Helper view to tell swiftui to watch a certain object without needing to create another view (Note that when nesting, you must include parent wach objects in the toWatch Array)
struct WatchObj<Content: View>: View {
    @ObservedObject var toWatch0: WatchableObject
    @ObservedObject var toWatch1: WatchableObject
    @ObservedObject var toWatch2: WatchableObject
    @ObservedObject var toWatch3: WatchableObject
    var content: () -> Content

    init(toWatch: [WatchableObject], @ViewBuilder content: @escaping () -> Content) {
        self.content = content
        self.toWatch0 = toWatch.count > 0 ? toWatch[0] : WatchableObject()
        self.toWatch1 = toWatch.count > 1 ? toWatch[1] : WatchableObject()
        self.toWatch2 = toWatch.count > 2 ? toWatch[2] : WatchableObject()
        self.toWatch3 = toWatch.count > 3 ? toWatch[3] : WatchableObject()
        if toWatch.count > 4 {
            print("Warning! Need to update WatchObj struct as it does not support watching this many objects")
        }
    }

    var body: some View {
        VStack(content: content)
    }
}

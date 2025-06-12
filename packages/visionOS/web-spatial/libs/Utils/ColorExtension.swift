import SwiftUI

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "#", with: "")

        guard hex.count == 6 || hex.count == 8 else {
            self.init(.sRGB, red: 0, green: 0, blue: 0, opacity: 1)
            return
        }

        let scanner = Scanner(string: hex)
        var hexNumber: UInt64 = 0
        scanner.scanHexInt64(&hexNumber)

        let r, g, b, a: Double
        if hex.count == 8 {
            r = Double((hexNumber & 0xFF00_0000) >> 24) / 255
            g = Double((hexNumber & 0x00FF_0000) >> 16) / 255
            b = Double((hexNumber & 0x0000_FF00) >> 8) / 255
            a = Double(hexNumber & 0x0000_00FF) / 255
        } else {
            a = 1.0
            r = Double((hexNumber & 0xFF0000) >> 16) / 255
            g = Double((hexNumber & 0x00FF00) >> 8) / 255
            b = Double(hexNumber & 0x0000FF) / 255
        }

        self.init(.sRGB, red: r, green: g, blue: b, opacity: a)
    }
}

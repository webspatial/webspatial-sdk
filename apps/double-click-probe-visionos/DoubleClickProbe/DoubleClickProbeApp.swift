import SwiftUI

@main
struct DoubleClickProbeApp: App {
    var body: some Scene {
        WindowGroup {
            DoubleClickProbeDemoSelector()
        }
        .windowStyle(.plain)
        .defaultSize(CGSize(width: 1180, height: 760))
    }
}

struct DoubleClickProbeDemoSelector: View {
    @State private var selectedDemo = DoubleClickProbeDemo.demo2

    var body: some View {
        HStack(alignment: .top, spacing: 0) {
            sidebar
                .frame(width: 320)
                .padding(20)
                .background(.regularMaterial)

            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(selectedDemo.title)
                        .font(.title2.bold())
                    Text(selectedDemo.summary)
                        .font(.callout)
                        .foregroundStyle(.secondary)
                    Text(selectedDemo.expectedResult)
                        .font(.caption.monospaced())
                        .foregroundStyle(selectedDemo.expectsDoubleClick ? .green : .orange)
                }
                .padding(.horizontal, 20)
                .padding(.top, 18)

                Divider()

                selectedDemo.content
                    .id(selectedDemo.id)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding(20)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 28, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .stroke(.white.opacity(0.18), lineWidth: 1)
        }
        .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
        .shadow(color: .black.opacity(0.22), radius: 28, y: 18)
        .padding(24)
    }

    private var sidebar: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Double-click probe")
                .font(.title3.bold())
            Text("Select a control or protocol case, double click the probe button, then inspect Xcode console logs prefixed with [DoubleClickProbe].")
                .font(.caption)
                .foregroundStyle(.secondary)

            Divider()

            ForEach(DoubleClickProbeDemo.allCases) { demo in
                Button {
                    selectedDemo = demo
                } label: {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(demo.shortTitle)
                            .font(.headline)
                        Text(demo.axis)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 6)
                }
                .buttonStyle(.borderedProminent)
                .tint(selectedDemo == demo ? .blue : .gray)
            }

            Spacer()
        }
    }
}

enum DoubleClickProbeDemo: String, CaseIterable, Identifiable {
    case demo0
    case demo1
    case demo2
    case demo3
    case demo4
    case demo5
    case demo6
    case demo7
    case demo8

    var id: String {
        rawValue
    }

    var shortTitle: String {
        switch self {
        case .demo0:
            return "Demo 0 baseline"
        case .demo1:
            return "Demo 1 about:blank"
        case .demo2:
            return "Demo 2 style"
        case .demo3:
            return "Demo 3 protocol style"
        case .demo4:
            return "Demo 4 head sync"
        case .demo5:
            return "Demo 5 React portal"
        case .demo6:
            return "Demo 6 protocol portal"
        case .demo7:
            return "Demo 7 nested about"
        case .demo8:
            return "Demo 8 nested protocol"
        }
    }

    var title: String {
        switch self {
        case .demo0:
            return "Demo 0: Direct WKWebView + SwiftUI ornament baseline"
        case .demo1:
            return "Demo 1: window.open about:blank + createWebViewWith + ornament"
        case .demo2:
            return "Demo 2: about:blank + WebSpatial-like viewport/body style"
        case .demo3:
            return "Demo 3: webspatial://createOrnament + WebSpatial-like body style"
        case .demo4:
            return "Demo 4: about:blank + head/style/class sync"
        case .demo5:
            return "Demo 5: about:blank + React portal"
        case .demo6:
            return "Demo 6: webspatial://createOrnament + React portal"
        case .demo7:
            return "Demo 7: about:blank + nested child WKWebView + z offset"
        case .demo8:
            return "Demo 8: webspatial://createSpatialized2DElement + nested child WKWebView"
        }
    }

    var axis: String {
        switch self {
        case .demo0:
            return "Native WKWebView baseline"
        case .demo1, .demo2, .demo4, .demo5, .demo7:
            return "Control path, expects dblclick"
        case .demo3, .demo6, .demo8:
            return "Protocol path, reproduces loss"
        }
    }

    var summary: String {
        switch self {
        case .demo0:
            return "Verifies that root and ornament-hosted WKWebView instances can synthesize DOM dblclick without window.open."
        case .demo1:
            return "Keeps window.open and createWebViewWith, but uses about:blank as the initial child URL."
        case .demo2:
            return "Adds WebSpatial-like viewport and body styles to the about:blank child window."
        case .demo3:
            return "Keeps the no-React style probe from demo 2, but opens webspatial://createOrnament."
        case .demo4:
            return "Adds head style/link cloning and documentElement className sync to the about:blank child window."
        case .demo5:
            return "Adds React synthetic events and a cross-window React portal on the about:blank path."
        case .demo6:
            return "Changes only the initial child URL to webspatial://createOrnament while keeping the React portal path."
        case .demo7:
            return "Uses a plain nested SwiftUI host with z offset and an about:blank child window."
        case .demo8:
            return "Uses the same nested SwiftUI host as demo 7, but opens webspatial://createSpatialized2DElement."
        }
    }

    var expectsDoubleClick: Bool {
        switch self {
        case .demo3, .demo6, .demo8:
            return false
        case .demo0, .demo1, .demo2, .demo4, .demo5, .demo7:
            return true
        }
    }

    var expectedResult: String {
        expectsDoubleClick
            ? "Expected: click detail=2 and dblclick detail=2 should appear."
            : "Expected reproduction: dblclick is missing on the child WKWebView."
    }

    @ViewBuilder
    var content: some View {
        switch self {
        case .demo0:
            Demo0DirectWKWebViewOrnament()
        case .demo1:
            Demo1WindowOpenChildOrnament()
        case .demo2:
            Demo2WindowOpenChildWithViewportAndStyle()
        case .demo3:
            Demo3ProtocolURLChildWithViewportAndStyle()
        case .demo4:
            Demo4WindowOpenChildWithHeadSync()
        case .demo5:
            Demo5ReactPortalToWindowOpenChild()
        case .demo6:
            Demo6ProtocolURLReactPortalChild()
        case .demo7:
            Demo7NestedAboutBlankChildWebView()
        case .demo8:
            Demo8NestedProtocolChildWebView()
        }
    }
}

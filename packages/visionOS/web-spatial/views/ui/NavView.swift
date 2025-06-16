import SwiftUI
import WebKit

struct NavView: View {
    static let navHeight: CGFloat = 60
    static let minWidth: CGFloat = 400
    @State var swc: SpatialWindowComponent?
    @StateObject var navInfo: NavInfo
    @State var navWidth: CGFloat = 0
    @State private var showCopyTip = false
    @State private var contentHeight: CGFloat = 60
    @State private var texWidth: CGFloat = 0
    @State private var firstGetSize: Bool = true
    @State private var timer: Timer?
    @State private var timeRemaining = 5
    @State private var showEnter: Double = 1
    @State private var showNav: Double = 0
    @State private var showUrl: Double = 0
    @Namespace var hoverNamespace
    var navHoverGroup: HoverEffectGroup {
        HoverEffectGroup(hoverNamespace)
    }

    var body: some View {
        ZStack {
            ZStack {
                HStack(spacing: 10) {
                    Image("logo").resizable().frame(width: 32, height: 32)
                        .cornerRadius(100)
                    if pwaManager.display == .minimal {
                        NavButton(action: { swc?.goBack() }, children: Image("arrow_left"), clearBackGround: true).disabled(!(swc?.canGoBack ?? false))
                        NavButton(action: { swc?.goForward() }, children: Image("arrow_right"), clearBackGround: true).disabled(!(swc?.canGoBack ?? false))
                        NavButton(action: { swc?.reload() }, children: Image("refresh"), clearBackGround: true)
                        NavDivider()
                    }
                    NavButton(action: { print("click"); withAnimation(.easeInOut(duration: 0.5)) { showNav = 1.0; showEnter = 0 } }, children: Image("more"), clearBackGround: true)
                }
                .padding(12)
                .background(Color(hex: "#161616E5"))
                .hoverEffect(in: navHoverGroup) { effect, isActive, _ in
                    effect.opacity((isActive && showNav == 0 && showUrl == 0) ? 1 : 0)
                }
                Image("nav").resizable().frame(width: 32, height: 32).hoverEffect(.highlight).hoverEffect(in: navHoverGroup) { effect, isActive, _ in
                    effect.opacity((isActive && showNav == 0 && showUrl == 0) ? 0 : 1)
                }
            }
            .frame(height: contentHeight)
            .cornerRadius(100)
            .opacity(showEnter)
            HStack(spacing: 14) {
                if pwaManager.display == .minimal {
                    NavButton(action: { swc?.goBack() }, children: Image("arrow_left")).disabled(!(swc?.canGoBack ?? false))
                    NavButton(action: { swc?.goForward() }, children: Image("arrow_right")).disabled(!(swc?.canGoBack ?? false))
                    NavButton(action: { swc?.reload() }, children: Image("refresh"))
                    NavDivider()
                }
                NavButton(action: { swc?.navigateToURL(url: URL(string: pwaManager.start_url)!) }, children: Image("home"))
                NavButton(action: { withAnimation(.easeInOut(duration: 0.5)) { showUrl = 1; showNav = 0 } }, children: Image("link"))
                NavButton(action: { showNav = 0; showEnter = 1 }, children: Image("back"))
            }
            .padding(12)
            .background(Color(hex: "#161616E5"))
            .cornerRadius(100)
            .opacity(showNav)
            .onChange(of: showNav) { _, newValue in
                if newValue == 1 {
                    startTimer()
                } else {
                    stopTimer()
                }
            }
            HStack(spacing: 6) {
                Text(navInfo.url.count > 0 ? navInfo.url : (swc?.getURL()?.absoluteString ?? ""))
                    .lineLimit(1)
                    .textSelection(.enabled)
                    .padding(12)
                    .frame(minWidth: 200)
                    .frame(maxWidth: 500)
                    .frame(height: 44)
                    .background(.black)
                    .cornerRadius(100)
                NavButton(action: {
                    UIPasteboard.general.string = swc?.getURL()?.absoluteString ?? ""
                    showCopyTip = true
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                        showCopyTip = false
                    }
                    withAnimation(.easeInOut(duration: 0.5)) { showUrl = 0; showNav = 1 }
                }, children: Image("copy"))
                NavButton(action: {
                    print("open browser")
                    UIApplication.shared.open(URL(string: navInfo.url.count > 0 ? navInfo.url : (swc?.getURL()?.absoluteString ?? ""))!, options: [:], completionHandler: nil)
                    withAnimation(.easeInOut(duration: 0.5)) { showUrl = 0; showNav = 1 }
                }, children: Image("browser"))
                NavButton(action: { withAnimation(.easeInOut(duration: 0.5)) { showUrl = 0; showNav = 1 } }, children: Image("close"))
            }
            .popover(isPresented: $showCopyTip) {
                Text("copied！")
                    .padding()
                    .background(Color(hex: "#161616E5"))
                    .cornerRadius(10)
            }
            .padding(8)
            .background(Color(hex: "#161616E5"))
            .cornerRadius(100)
            .opacity(showUrl)
        }
    }

    private func startTimer() {
        timeRemaining = 5
        timer = Timer.scheduledTimer(
            withTimeInterval: 1,
            repeats: true
        ) { _ in
            timeRemaining -= 1

            if timeRemaining <= 0 {
                showNav = 0
                showEnter = 1
                stopTimer()
            }
        }
    }

    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }
}

struct NavButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .background(Color.clear)
    }
}

struct NavButton: View {
    var action: () -> Void
    var children: Image
    var size: CGFloat = 44
    var padding: CGFloat = 10
    var clearBackGround: Bool = true
    var body: some View {
        if clearBackGround {
            Button(action: action, label: {
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0))
                        .frame(width: size, height: size)
                        .overlay(
                            children.resizable().frame(width: size - padding * 2, height: size - padding * 2)
                        )
                        .contentShape(Circle())
                }
            }).buttonStyle(NavButtonStyle()).frame(width: size, height: size).hoverEffect(.highlight)
        } else {
            Button(action: action, label: {
                Circle()
                    .fill(Color.white.opacity(0))
                    .frame(width: size, height: size)
                    .overlay(
                        children.resizable().frame(width: size - padding * 2, height: size - padding * 2)
                    )
                    .contentShape(Circle())
            }).hoverEffect(.highlight)
        }
    }
}

struct NavDivider: View {
    var width: CGFloat = 1
    var height: CGFloat = 16
    var paddingLR: CGFloat = 4
    var paddingTB: CGFloat = 12
    var body: some View {
        VStack {
            Rectangle().fill(Color(hex: "#FFFFFF3D")).frame(width: width, height: height)
        }
        .padding([.top, .bottom], paddingTB)
        .padding([.leading, .trailing], paddingLR)
    }
}

// struct NavView_Previews: PreviewProvider {
//    static var previews: some View {
//        NavView()
//    }
// }

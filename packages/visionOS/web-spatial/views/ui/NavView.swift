import SwiftUI
import WebKit

struct NavView: View {
    static let navHeight: CGFloat = 80
    @State var swc: SpatialWindowComponent?
    @StateObject var navInfo: NavInfo
    @State var showUrl: Bool = false
    @State private var showNav: Bool = false
    @State private var showCopyTip = false
    @State private var navWidth: CGFloat = 0
    @State private var contentHeight: CGFloat = 68
    @State private var texWidth: CGFloat = 0
    @State private var firstGetSize: Bool = true
    @Namespace var hoverNamespace
    var navHoverGroup: HoverEffectGroup {
        HoverEffectGroup(hoverNamespace)
    }

    var body: some View {
        ZStack {
            ZStack {
                HStack {
                    Image("logo").resizable().frame(width: 44, height: 44)
                        .cornerRadius(100)
                    NavButton(action: { print("click"); showNav = true }, children: Image(systemName: "link"))
                }
                .padding(12)
                .background(.thinMaterial)
                .hoverEffect(in: navHoverGroup) { effect, isActive, _ in
                    effect.opacity((isActive && !showNav) ? 1 : 0)
                }
                Image("nav").resizable().frame(width: 29, height: 29).hoverEffect(.highlight).hoverEffect(in: navHoverGroup) { effect, isActive, _ in
                    effect.opacity((isActive && !showNav) ? 0 : 1)
                }
            }
            .frame(height: contentHeight)
            .cornerRadius(100)
            .hoverEffect(in: navHoverGroup) { effect, isActive, proxy in
                effect.clipShape(.capsule.size(
                    width: isActive ? proxy.size.width : proxy.size.height,
                    height: proxy.size.height,
                    anchor: .center
                ))
            }
            .opacity(showNav ? 0 : 1)
//            if showNav {
            HStack(spacing: 14) {
                if pwaManager.display == .minimal {
                    NavButton(action: { swc?.goBack() }, children: Image(systemName: "arrow.left"), clearBackGround: true).disabled(!(swc?.canGoBack ?? false))
                    NavButton(action: { swc?.goForward() }, children: Image(systemName: "arrow.right"), clearBackGround: true).disabled(!(swc?.canGoBack ?? false))
                }
                NavButton(action: { swc?.reload() }, children: Image(systemName: "arrow.clockwise"), clearBackGround: true)
                NavButton(action: { swc?.navigateToURL(url: URL(string: pwaManager.start_url)!) }, children: Image(systemName: "house.fill"), clearBackGround: true)
                NavButton(action: { withAnimation(.easeInOut(duration: 0.5)) { showUrl = true } }, children: Image(systemName: "link"), clearBackGround: true)
                NavButton(action: { showNav = false }, children: Image(systemName: "chevron.up"))
            }
            .padding(12)
            .glassBackgroundEffect(in: RoundedRectangle(cornerRadius: 100))
            .opacity(withAnimation(.easeInOut(duration: 0.5)) { showNav ? 1 : 0 })
            .ornament(attachmentAnchor: .scene(.top), contentAlignment: .top) {
                if showUrl {
                    HStack(spacing: 14) {
                        Text(navInfo.url.count > 0 ? navInfo.url : (swc?.getURL()?.absoluteString ?? ""))
                            .padding()
                            .lineLimit(1)
                            .overlay(GeometryReader { geo -> AnyView in
                                DispatchQueue.main.async {
                                    if geo.size.width > 0 {
                                        texWidth = .minimum(300, geo.size.width)
                                    }
                                }
                                return AnyView(EmptyView())
                            })
                            .frame(width: .maximum(300, texWidth))
                        NavButton(action: {
                            UIPasteboard.general.string = swc?.getURL()?.absoluteString ?? ""
                            showCopyTip = true
                            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                                showCopyTip = false
                            }
                        }, children: Image(systemName: "square.on.square"))
                        NavButton(action: { showUrl = false }, children: Image(systemName: "xmark"))
                    }
                    .padding(12)
                    .glassBackgroundEffect(in: RoundedRectangle(cornerRadius: 100))
                    .popover(isPresented: $showCopyTip) {
                        Text("copied！")
                            .padding()
                            .cornerRadius(10)
                    }
                }
            }
//            }
        }

//        else{

//        }
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
    var clearBackGround: Bool = false
    var body: some View {
        if clearBackGround {
            Button(action: action, label: {
                Circle()
                    .fill(Color.white.opacity(0))
                    .frame(width: size, height: size)
                    .overlay(
                        children.frame(width: size, height: size).padding(padding)
                    )
            }).frame(width: size, height: size).buttonStyle(NavButtonStyle()).hoverEffect(.highlight)
        } else {
            Button(action: action, label: {
                Circle()
                    .fill(Color.white.opacity(0))
                    .frame(width: size, height: size)
                    .overlay(
                        children.frame(width: size, height: size).padding(padding)
                    )
            }).frame(width: size, height: size).hoverEffect(.highlight)
        }
    }
}

// struct NavView_Previews: PreviewProvider {
//    static var previews: some View {
//        NavView()
//    }
// }

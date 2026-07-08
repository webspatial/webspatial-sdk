import SwiftUI
@preconcurrency import WebKit

struct Demo0DirectWKWebViewOrnament: View {
    var body: some View {
        ProbeHTMLWebView(
            label: "demo0-root-direct",
            html: DoubleClickProbeHTML.plainPage(label: "demo0-root-direct", title: "Demo 0 Root WKWebView")
        )
        .frame(width: 720, height: 520)
        .glassBackgroundEffect()
        .ornament(
            attachmentAnchor: .scene(.trailing),
            contentAlignment: .center
        ) {
            ProbeHTMLWebView(
                label: "demo0-direct-ornament",
                html: DoubleClickProbeHTML.plainPage(label: "demo0-direct-ornament", title: "Demo 0 Direct Ornament WKWebView")
            )
            .frame(width: 360, height: 240)
            .glassBackgroundEffect()
        }
    }
}

struct Demo1WindowOpenChildOrnament: View {
    @State private var childWebView: WKWebView?

    var body: some View {
        WindowOpenProbeRootWebView(
            childWebView: $childWebView,
            label: "demo1-window-open-root",
            html: rootHTML
        )
        .frame(width: 720, height: 520)
        .glassBackgroundEffect()
        .ornament(
            attachmentAnchor: .scene(.trailing),
            contentAlignment: .center
        ) {
            Group {
                if let childWebView {
                    ExistingWKWebView(webView: childWebView)
                } else {
                    Text("Waiting for demo 1 child WKWebView")
                        .font(.headline)
                        .foregroundStyle(.white)
                        .padding()
                }
            }
            .frame(width: 360, height: 240)
            .glassBackgroundEffect()
        }
    }

    private var rootHTML: String {
        let childHTML = DoubleClickProbeHTML.plainPage(
            label: "demo1-window-open-child",
            title: "Demo 1 window.open Child WKWebView"
        )
        return DoubleClickProbeHTML.plainPage(
            label: "demo1-window-open-root",
            title: "Demo 1 Root WKWebView",
            extraScript: windowOpenScript(childHTML: childHTML, url: "about:blank", childLabel: "demo1-window-open-child")
        )
    }

    private func windowOpenScript(childHTML: String, url: String, childLabel: String) -> String {
        """
        const childHTML = \(DoubleClickProbeHTML.jsStringLiteral(childHTML));
        let childWindow = null;

        function openChildWindow(reason) {
          if (childWindow && !childWindow.closed) {
            postProbe({ label, scope: "window-open", type: "child-already-open", reason });
            return;
          }
          childWindow = window.open("\(url)", "native-window-open-child", "width=360,height=240");
          if (!childWindow) {
            postProbe({ label, scope: "window-open", type: "window-open-null", reason });
            return;
          }
          childWindow.document.open();
          childWindow.document.write(childHTML);
          childWindow.document.close();
          postProbe({ label, scope: "window-open", type: "opened-child", reason, childLabel: "\(childLabel)" });
        }

        setTimeout(() => openChildWindow("auto"), 300);
        """
    }
}

struct Demo2WindowOpenChildWithViewportAndStyle: View {
    @State private var childWebView: WKWebView?

    var body: some View {
        WindowOpenProbeRootWebView(
            childWebView: $childWebView,
            label: "demo2-window-open-style-root",
            html: rootHTML
        )
        .frame(width: 720, height: 520)
        .glassBackgroundEffect()
        .ornament(
            attachmentAnchor: .scene(.trailing),
            contentAlignment: .center
        ) {
            Group {
                if let childWebView {
                    ExistingWKWebView(webView: childWebView)
                } else {
                    Text("Waiting for demo 2 child WKWebView")
                        .font(.headline)
                        .foregroundStyle(.white)
                        .padding()
                }
            }
            .frame(width: 360, height: 240)
            .glassBackgroundEffect()
        }
    }

    private var rootHTML: String {
        let childHTML = DoubleClickProbeHTML.plainPage(
            label: "demo2-window-open-style-child",
            title: "Demo 2 Child + WebSpatial Body Style"
        )
        return DoubleClickProbeHTML.plainPage(
            label: "demo2-window-open-style-root",
            title: "Demo 2 Root WKWebView",
            extraScript: """
            const childHTML = \(DoubleClickProbeHTML.jsStringLiteral(childHTML));
            let childWindow = null;

            function openChildWindow(reason) {
              if (childWindow && !childWindow.closed) return;
              childWindow = window.open("about:blank", "native-window-open-child", "width=360,height=240");
              if (!childWindow) {
                postProbe({ label, scope: "window-open", type: "window-open-null", reason });
                return;
              }
              childWindow.document.open();
              childWindow.document.write(childHTML);
              childWindow.document.close();
              \(DoubleClickProbeHTML.webSpatialBodyStyleScript(forWindow: "childWindow"))
              postProbe({ label, scope: "window-open", type: "opened-child", reason, childLabel: "demo2-window-open-style-child" });
            }

            setTimeout(() => openChildWindow("auto"), 300);
            """
        )
    }
}

struct Demo3ProtocolURLChildWithViewportAndStyle: View {
    @State private var childWebView: WKWebView?

    var body: some View {
        WindowOpenProbeRootWebView(
            childWebView: $childWebView,
            label: "demo3-protocol-style-root",
            html: rootHTML
        )
        .frame(width: 720, height: 520)
        .glassBackgroundEffect()
        .ornament(
            attachmentAnchor: .scene(.trailing),
            contentAlignment: .center
        ) {
            Group {
                if let childWebView {
                    ExistingWKWebView(webView: childWebView)
                } else {
                    Text("Waiting for demo 3 child WKWebView")
                        .font(.headline)
                        .foregroundStyle(.white)
                        .padding()
                }
            }
            .frame(width: 360, height: 240)
            .glassBackgroundEffect()
        }
    }

    private var rootHTML: String {
        let childHTML = DoubleClickProbeHTML.plainPage(
            label: "demo3-protocol-style-child",
            title: "Demo 3 webspatial:// Child + WebSpatial Body Style"
        )

        return DoubleClickProbeHTML.plainPage(
            label: "demo3-protocol-style-root",
            title: "Demo 3 Root WKWebView",
            extraScript: """
            const childHTML = \(DoubleClickProbeHTML.jsStringLiteral(childHTML));
            let childWindow = null;

            function openChildWindow(reason) {
              if (childWindow && !childWindow.closed) {
                postProbe({ label, scope: "window-open", type: "child-already-open", reason });
                return;
              }

              childWindow = window.open(
                "webspatial://createOrnament?command=createOrnament&attachmentAnchor=bottom&contentAlignment=back&visibility=visible&width=360&height=240",
                "native-window-open-child",
                "width=360,height=240"
              );

              if (!childWindow) {
                postProbe({ label, scope: "window-open", type: "window-open-null", reason });
                return;
              }

              childWindow.document.open();
              childWindow.document.write(childHTML);
              childWindow.document.close();
              \(DoubleClickProbeHTML.webSpatialBodyStyleScript(forWindow: "childWindow"))
              postProbe({ label, scope: "window-open", type: "opened-child", reason, childLabel: "demo3-protocol-style-child" });
            }

            setTimeout(() => openChildWindow("auto"), 300);
            """
        )
    }
}

struct Demo4WindowOpenChildWithHeadSync: View {
    @State private var childWebView: WKWebView?

    var body: some View {
        WindowOpenProbeRootWebView(
            childWebView: $childWebView,
            label: "demo4-window-open-head-root",
            html: rootHTML
        )
        .frame(width: 720, height: 520)
        .glassBackgroundEffect()
        .ornament(
            attachmentAnchor: .scene(.trailing),
            contentAlignment: .center
        ) {
            Group {
                if let childWebView {
                    ExistingWKWebView(webView: childWebView)
                } else {
                    Text("Waiting for demo 4 child WKWebView")
                        .font(.headline)
                        .foregroundStyle(.white)
                        .padding()
                }
            }
            .frame(width: 360, height: 240)
            .glassBackgroundEffect()
        }
    }

    private var rootHTML: String {
        let childHTML = DoubleClickProbeHTML.plainPage(
            label: "demo4-window-open-head-child",
            title: "Demo 4 Child + Style + Head Sync"
        )
        return DoubleClickProbeHTML.plainPage(
            label: "demo4-window-open-head-root",
            title: "Demo 4 Root WKWebView",
            extraScript: """
            const childHTML = \(DoubleClickProbeHTML.jsStringLiteral(childHTML));
            let childWindow = null;

            function openChildWindow(reason) {
              if (childWindow && !childWindow.closed) return;
              childWindow = window.open("about:blank", "native-window-open-child", "width=360,height=240");
              if (!childWindow) {
                postProbe({ label, scope: "window-open", type: "window-open-null", reason });
                return;
              }
              childWindow.document.open();
              childWindow.document.write(childHTML);
              childWindow.document.close();
              \(DoubleClickProbeHTML.webSpatialSetupScript(forWindow: "childWindow"))
              postProbe({ label, scope: "window-open", type: "opened-child", reason, childLabel: "demo4-window-open-head-child" });
            }

            setTimeout(() => openChildWindow("auto"), 300);
            """
        )
    }
}

struct Demo5ReactPortalToWindowOpenChild: View {
    @State private var childWebView: WKWebView?

    var body: some View {
        WindowOpenProbeRootWebView(
            childWebView: $childWebView,
            label: "demo5-react-portal-root",
            html: DoubleClickProbeHTML.reactPortalRootHTML(
                rootLabel: "demo5-react-root",
                childLabel: "demo5-react-portal-child",
                openURL: "about:blank"
            )
        )
        .frame(width: 720, height: 520)
        .glassBackgroundEffect()
        .ornament(
            attachmentAnchor: .scene(.trailing),
            contentAlignment: .center
        ) {
            Group {
                if let childWebView {
                    ExistingWKWebView(webView: childWebView)
                } else {
                    Text("Waiting for demo 5 child WKWebView")
                        .font(.headline)
                        .foregroundStyle(.white)
                        .padding()
                }
            }
            .frame(width: 360, height: 240)
            .glassBackgroundEffect()
        }
    }
}

struct Demo6ProtocolURLReactPortalChild: View {
    @State private var childWebView: WKWebView?

    var body: some View {
        WindowOpenProbeRootWebView(
            childWebView: $childWebView,
            label: "demo6-protocol-react-root",
            html: DoubleClickProbeHTML.reactPortalRootHTML(
                rootLabel: "demo6-protocol-react-root",
                childLabel: "demo6-protocol-react-portal-child",
                openURL: "webspatial://createOrnament?command=createOrnament&attachmentAnchor=bottom&contentAlignment=back&visibility=visible&width=360&height=240"
            )
        )
        .frame(width: 720, height: 520)
        .glassBackgroundEffect()
        .ornament(
            attachmentAnchor: .scene(.trailing),
            contentAlignment: .center
        ) {
            Group {
                if let childWebView {
                    ExistingWKWebView(webView: childWebView)
                } else {
                    Text("Waiting for demo 6 child WKWebView")
                        .font(.headline)
                        .foregroundStyle(.white)
                        .padding()
                }
            }
            .frame(width: 360, height: 240)
            .glassBackgroundEffect()
        }
    }
}

struct Demo7NestedAboutBlankChildWebView: View {
    @State private var childWebView: WKWebView?

    var body: some View {
        ZStack(alignment: .topLeading) {
            WindowOpenProbeRootWebView(
                childWebView: $childWebView,
                label: "demo7-nested-about-root",
                html: rootHTML
            )
            .frame(width: 720, height: 520)
            .glassBackgroundEffect()

            childHost
                .frame(width: 360, height: 240)
                .offset(x: 340, y: 160)
                .offset(z: 80)
        }
        .frame(width: 720, height: 520)
    }

    private var childHost: some View {
        Group {
            if let childWebView {
                ExistingWKWebView(webView: childWebView)
            } else {
                Text("Waiting for demo 7 nested child WKWebView")
                    .font(.headline)
                    .foregroundStyle(.white)
                    .padding()
            }
        }
        .frame(width: 360, height: 240)
        .glassBackgroundEffect()
    }

    private var rootHTML: String {
        let childHTML = DoubleClickProbeHTML.plainPage(
            label: "demo7-nested-about-child",
            title: "Demo 7 Nested about:blank Child WKWebView"
        )

        return DoubleClickProbeHTML.plainPage(
            label: "demo7-nested-about-root",
            title: "Demo 7 Root WKWebView",
            extraScript: windowOpenScript(childHTML: childHTML)
        )
    }

    private func windowOpenScript(childHTML: String) -> String {
        """
        const childHTML = \(DoubleClickProbeHTML.jsStringLiteral(childHTML));
        let childWindow = null;

        function openChildWindow(reason) {
          if (childWindow && !childWindow.closed) {
            postProbe({ label, scope: "nested-child", type: "child-already-open", reason });
            return;
          }

          childWindow = window.open("about:blank", "nested-about-child", "width=360,height=240");
          if (!childWindow) {
            postProbe({ label, scope: "nested-child", type: "window-open-null", reason });
            return;
          }

          childWindow.document.open();
          childWindow.document.write(childHTML);
          childWindow.document.close();
          postProbe({ label, scope: "nested-child", type: "opened-child", reason, childLabel: "demo7-nested-about-child" });
        }

        setTimeout(() => openChildWindow("auto"), 300);
        """
    }
}

struct Demo8NestedProtocolChildWebView: View {
    @State private var childWebView: WKWebView?

    var body: some View {
        ZStack(alignment: .topLeading) {
            WindowOpenProbeRootWebView(
                childWebView: $childWebView,
                label: "demo8-nested-protocol-root",
                html: rootHTML
            )
            .frame(width: 720, height: 520)
            .glassBackgroundEffect()

            childHost
                .frame(width: 360, height: 240)
                .offset(x: 340, y: 160)
                .offset(z: 80)
        }
        .frame(width: 720, height: 520)
    }

    private var childHost: some View {
        Group {
            if let childWebView {
                ExistingWKWebView(webView: childWebView)
            } else {
                Text("Waiting for demo 8 nested child WKWebView")
                    .font(.headline)
                    .foregroundStyle(.white)
                    .padding()
            }
        }
        .frame(width: 360, height: 240)
        .glassBackgroundEffect()
    }

    private var rootHTML: String {
        let childHTML = DoubleClickProbeHTML.plainPage(
            label: "demo8-nested-protocol-child",
            title: "Demo 8 Nested webspatial:// Child WKWebView"
        )

        return DoubleClickProbeHTML.plainPage(
            label: "demo8-nested-protocol-root",
            title: "Demo 8 Root WKWebView",
            extraScript: protocolSpatialized2DScript(childHTML: childHTML)
        )
    }

    private func protocolSpatialized2DScript(childHTML: String) -> String {
        """
        const childHTML = \(DoubleClickProbeHTML.jsStringLiteral(childHTML));
        let childWindow = null;

        function openChildWindow(reason) {
          if (childWindow && !childWindow.closed) {
            postProbe({ label, scope: "nested-child", type: "child-already-open", reason });
            return;
          }

          childWindow = window.open(
            "webspatial://createSpatialized2DElement?command=createSpatialized2DElement",
            "nested-protocol-child",
            "width=360,height=240"
          );

          if (!childWindow) {
            postProbe({ label, scope: "nested-child", type: "window-open-null", reason });
            return;
          }

          childWindow.document.open();
          childWindow.document.write(childHTML);
          childWindow.document.close();
          postProbe({
            label,
            scope: "nested-child",
            type: "opened-child",
            reason,
            childLabel: "demo8-nested-protocol-child"
          });
        }

        setTimeout(() => openChildWindow("auto"), 300);
        """
    }
}

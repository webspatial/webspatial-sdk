import Foundation
import SwiftUI
@preconcurrency import WebKit

struct ExistingWKWebView: UIViewRepresentable {
    let webView: WKWebView

    func makeUIView(context: Context) -> WKWebView {
        webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    static func dismantleUIView(_ webView: WKWebView, coordinator: ()) {
        webView.configuration.userContentController.removeScriptMessageHandler(forName: "probe")
    }
}

struct ProbeHTMLWebView: UIViewRepresentable {
    let label: String
    let html: String

    func makeCoordinator() -> ProbeCoordinator {
        ProbeCoordinator(label: label)
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = true
        configuration.userContentController.add(context.coordinator, name: "probe")
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.isInspectable = true
        webView.navigationDelegate = context.coordinator
        webView.scrollView.bounces = false
        webView.loadHTMLString(html, baseURL: nil)
        NSLog("[DoubleClickProbe][%@] makeUIView window=%@", label, webView.window.map { String(describing: type(of: $0)) } ?? "nil")
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    static func dismantleUIView(_ webView: WKWebView, coordinator: ProbeCoordinator) {
        webView.configuration.userContentController.removeScriptMessageHandler(forName: "probe")
    }
}

struct WindowOpenProbeRootWebView: UIViewRepresentable {
    @Binding var childWebView: WKWebView?
    let label: String
    let html: String

    func makeCoordinator() -> Coordinator {
        Coordinator(label: label, childWebView: $childWebView)
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = true
        configuration.userContentController.add(context.coordinator, name: "probe")
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.isInspectable = true
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.scrollView.bounces = false
        webView.loadHTMLString(html, baseURL: nil)
        NSLog("[DoubleClickProbe][%@] makeUIView window=%@", label, webView.window.map { String(describing: type(of: $0)) } ?? "nil")
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    static func dismantleUIView(_ webView: WKWebView, coordinator: Coordinator) {
        webView.configuration.userContentController.removeScriptMessageHandler(forName: "probe")
    }

    final class Coordinator: ProbeCoordinator, WKUIDelegate {
        private var childWebView: Binding<WKWebView?>

        init(label: String, childWebView: Binding<WKWebView?>) {
            self.childWebView = childWebView
            super.init(label: label)
        }

        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for navigationAction: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            configuration.preferences.javaScriptCanOpenWindowsAutomatically = true
            configuration.userContentController = WKUserContentController()
            configuration.userContentController.add(self, name: "probe")

            let child = WKWebView(frame: .zero, configuration: configuration)
            child.isInspectable = true
            child.navigationDelegate = self
            child.uiDelegate = self
            child.scrollView.bounces = false

            NSLog("[DoubleClickProbe][%@] createWebViewWith url=%@ targetFrame=%@", label, navigationAction.request.url?.absoluteString ?? "nil", navigationAction.targetFrame.map { String(describing: $0) } ?? "nil")

            DispatchQueue.main.async {
                self.childWebView.wrappedValue = child
            }

            return child
        }
    }
}

class ProbeCoordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
    let label: String

    init(label: String) {
        self.label = label
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        NSLog("[DoubleClickProbe][%@][JS] %@", label, String(describing: message.body))
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        NSLog("[DoubleClickProbe][%@] didFinish url=%@ window=%@", label, webView.url?.absoluteString ?? "nil", webView.window.map { String(describing: type(of: $0)) } ?? "nil")
    }
}

enum DoubleClickProbeHTML {
    static func plainPage(label: String, title: String, extraBody: String = "", extraScript: String = "", loadReact: Bool = false, emptyBody: Bool = false) -> String {
        let reactScripts = loadReact
            ? """
            <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
            """
            : ""
        let body = emptyBody
            ? ""
            : """
            <div><strong>\(title)</strong></div>
            <button id="probe">Double click / double tap</button>
            \(extraBody)
            """

        return """
        <!doctype html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            \(reactScripts)
            <style>
              html, body {
                margin: 0;
                width: 100%;
                height: 100%;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                background: rgba(8, 16, 32, 0.92);
                color: white;
                touch-action: auto;
              }
              body {
                box-sizing: border-box;
                padding: 20px 20px 118px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 14px;
              }
              button {
                border: 1px solid rgba(255, 255, 255, 0.4);
                border-radius: 14px;
                padding: 16px 18px;
                background: #2563eb;
                color: white;
                font-size: 18px;
                font-weight: 700;
                margin: 8px;
              }
              #double-click-probe-event-hud {
                position: fixed;
                left: 12px;
                right: 12px;
                bottom: 12px;
                z-index: 2147483647;
                box-sizing: border-box;
                padding: 12px 14px;
                border: 1px solid rgba(255, 255, 255, 0.26);
                border-radius: 16px;
                background: rgba(2, 6, 23, 0.86);
                box-shadow: 0 18px 45px rgba(0, 0, 0, 0.38);
                color: white;
                font-size: 13px;
                pointer-events: none;
                backdrop-filter: blur(16px);
              }
              .probe-hud-title {
                margin-bottom: 8px;
                color: rgba(255, 255, 255, 0.72);
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 0.12em;
                text-transform: uppercase;
              }
              .probe-hud-main {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
              }
              .probe-hud-field {
                min-width: 0;
              }
              .probe-hud-label {
                display: block;
                margin-bottom: 4px;
                color: rgba(255, 255, 255, 0.58);
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
              }
              .probe-hud-value {
                display: block;
                overflow: hidden;
                min-height: 22px;
                padding: 5px 8px;
                border-radius: 10px;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                font-size: 13px;
                font-weight: 900;
              }
              .probe-hud-value-type {
                background: #334155;
                color: white;
              }
              #double-click-probe-event-hud[data-event-type="pointerdown"] .probe-hud-value-type {
                background: #b45309;
              }
              #double-click-probe-event-hud[data-event-type="pointerup"] .probe-hud-value-type {
                background: #15803d;
              }
              #double-click-probe-event-hud[data-event-type="click"] .probe-hud-value-type {
                background: #2563eb;
              }
              #double-click-probe-event-hud[data-event-type="dblclick"] .probe-hud-value-type {
                background: #c026d3;
              }
              .probe-hud-value-target {
                background: rgba(14, 165, 233, 0.22);
                color: #bae6fd;
              }
              .probe-hud-meta {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 8px;
                margin-top: 9px;
                color: rgba(255, 255, 255, 0.72);
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                font-size: 11px;
              }
              .probe-hud-meta span {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            </style>
          </head>
          <body>
            \(body)
            <script>
              \(probeScript())
              const label = "\(label)";
              updateProbeEventHud(document, {
                label,
                scope: "ready",
                type: "waiting",
                detail: "-",
                target: "none",
                pointerType: "-",
                isTrusted: "-"
              });
              const button = document.getElementById("probe");
              if (button) installNativeProbe(button, label);
              \(extraScript)
            </script>
          </body>
        </html>
        """
    }

    static func blankChildPage() -> String {
        plainPage(label: "blank-child", title: "Blank child", emptyBody: true)
    }

    static func probeScript() -> String {
        """
        function postProbe(payload) {
          console.log(`[DoubleClickProbe][${payload.label}] ${payload.scope} ${payload.type} detail=${payload.detail} pointerType=${payload.pointerType || ""} target=${payload.target || ""}`, payload);
          window.webkit?.messageHandlers?.probe?.postMessage(payload);
        }

        function targetName(target) {
          if (!target) return "null";
          if (target === document) return "#document";
          return `${target.tagName || "node"}${target.id ? "#" + target.id : ""}`;
        }

        function eventDocument(event) {
          return event?.target?.ownerDocument || event?.currentTarget?.ownerDocument || document;
        }

        function ensureProbeEventHud(doc) {
          const ownerDocument = doc || document;
          let hud = ownerDocument.getElementById("double-click-probe-event-hud");
          if (hud) return hud;

          hud = ownerDocument.createElement("aside");
          hud.id = "double-click-probe-event-hud";
          hud.setAttribute("aria-live", "polite");
          hud.innerHTML = `
            <div class="probe-hud-title">Current click info</div>
            <div class="probe-hud-main">
              <div class="probe-hud-field">
                <span class="probe-hud-label">Event type</span>
                <span class="probe-hud-value probe-hud-value-type" data-probe-field="type">waiting</span>
              </div>
              <div class="probe-hud-field">
                <span class="probe-hud-label">Click target</span>
                <span class="probe-hud-value probe-hud-value-target" data-probe-field="target">none</span>
              </div>
            </div>
            <div class="probe-hud-meta">
              <span data-probe-field="detail">detail=-</span>
              <span data-probe-field="scope">scope=-</span>
              <span data-probe-field="pointer">pointer=-</span>
              <span data-probe-field="trusted">trusted=-</span>
            </div>
          `;
          (ownerDocument.body || ownerDocument.documentElement).appendChild(hud);
          return hud;
        }

        function setProbeText(hud, field, text) {
          const node = hud.querySelector(`[data-probe-field="${field}"]`);
          if (node) node.textContent = text;
        }

        function updateProbeEventHud(doc, payload) {
          const hud = ensureProbeEventHud(doc);
          hud.dataset.eventType = payload.type || "";
          setProbeText(hud, "type", payload.type || "-");
          setProbeText(hud, "target", payload.target || "-");
          setProbeText(hud, "detail", `detail=${payload.detail ?? "-"}`);
          setProbeText(hud, "scope", `scope=${payload.scope || "-"}`);
          setProbeText(hud, "pointer", `pointer=${payload.pointerType || "-"}`);
          setProbeText(hud, "trusted", `trusted=${payload.isTrusted ?? "-"}`);
        }

        function logNativeEvent(label, scope, event) {
          const payload = {
            label,
            scope,
            type: event.type,
            detail: event.detail,
            pointerType: event.pointerType,
            button: event.button,
            buttons: event.buttons,
            target: targetName(event.target),
            currentTarget: targetName(event.currentTarget),
            isTrusted: event.isTrusted,
            timeStamp: Math.round(event.timeStamp)
          };
          updateProbeEventHud(eventDocument(event), payload);
          postProbe(payload);
        }

        function logReactEvent(label, event) {
          const nativeEvent = event.nativeEvent || event;
          const payload = {
            label,
            scope: `react-${event._reactName || event.type}`,
            type: event.type,
            detail: event.detail,
            pointerType: event.pointerType,
            button: event.button,
            buttons: event.buttons,
            target: targetName(event.target),
            currentTarget: targetName(event.currentTarget),
            isTrusted: nativeEvent?.isTrusted,
            timeStamp: Math.round(event.timeStamp)
          };
          updateProbeEventHud(eventDocument(nativeEvent), payload);
          postProbe(payload);
        }

        function installNativeProbe(element, label) {
          if (!element || element.__nativeDoubleClickProbeInstalled) return;
          element.__nativeDoubleClickProbeInstalled = true;
          const ownerDocument = element.ownerDocument;
          ["pointerdown", "pointerup", "click", "dblclick"].forEach((type) => {
            ownerDocument.addEventListener(type, (event) => logNativeEvent(label, "native-document-capture", event), true);
            element.addEventListener(type, (event) => logNativeEvent(label, "native-button-capture", event), true);
            element.addEventListener(type, (event) => logNativeEvent(label, "native-button-bubble", event), false);
          });
        }
        """
    }

    static func webSpatialSetupScript(forWindow windowExpression: String) -> String {
        """
        \(webSpatialBodyStyleScript(forWindow: windowExpression))
        \(webSpatialHeadSyncScript(forWindow: windowExpression))
        """
    }

    static func webSpatialBodyStyleScript(forWindow windowExpression: String) -> String {
        """
        \(windowExpression).document.documentElement.style.backgroundColor = "transparent";
        \(windowExpression).document.body.style.margin = "0px";
        \(windowExpression).document.body.style.display = "inline-block";
        \(windowExpression).document.body.style.minWidth = "fit-content";
        \(windowExpression).document.body.style.minHeight = "auto";
        \(windowExpression).document.body.style.maxWidth = "fit-content";
        \(windowExpression).document.body.style.background = "transparent";
        postProbe({
          label: "window-open-root",
          scope: "setup",
          type: "applied-webspatial-body-style",
          bodyDisplay: \(windowExpression).document.body.style.display,
          minWidth: \(windowExpression).document.body.style.minWidth,
          maxWidth: \(windowExpression).document.body.style.maxWidth
        });
        """
    }

    static func webSpatialHeadSyncScript(forWindow windowExpression: String) -> String {
        """
        \(windowExpression).document.documentElement.className = document.documentElement.className;
        document.head.querySelectorAll("style, link[rel='stylesheet'][href]").forEach((node) => {
          \(windowExpression).document.head.appendChild(node.cloneNode(true));
        });
        postProbe({
          label: "window-open-root",
          scope: "setup",
          type: "applied-webspatial-child-window-setup",
          styleCount: document.head.querySelectorAll("style").length,
          linkCount: document.head.querySelectorAll("link[rel='stylesheet'][href]").length,
          className: document.documentElement.className
        });
        """
    }

    static func reactPortalRootHTML(rootLabel: String, childLabel: String, openURL: String) -> String {
        let childHTML = plainPage(label: "blank-child", title: "Blank child for React portal", emptyBody: true)
        return plainPage(
            label: rootLabel,
            title: "React Portal Root WKWebView",
            extraScript: """
            const childHTML = \(jsStringLiteral(childHTML));

            function ProbeButton({ label }) {
              const ref = React.useRef(null);
              React.useEffect(() => {
                installNativeProbe(ref.current, label);
              }, [label]);
              return React.createElement(
                "button",
                {
                  id: "probe",
                  ref,
                  onPointerDown: (event) => logReactEvent(label, event),
                  onPointerUp: (event) => logReactEvent(label, event),
                  onClick: (event) => logReactEvent(label, event),
                  onDoubleClick: (event) => logReactEvent(label, event),
                },
                `React portal probe: ${label}`,
              );
            }

            function App() {
              const [childWindow, setChildWindow] = React.useState(null);

              const openChildWindow = React.useCallback((reason) => {
                if (childWindow && !childWindow.closed) {
                  postProbe({ label, scope: "window-open", type: "child-already-open", reason });
                  return;
                }

                const nextWindow = window.open("\(openURL)", "native-window-open-child", "width=360,height=240");
                if (!nextWindow) {
                  postProbe({ label, scope: "window-open", type: "window-open-null", reason });
                  return;
                }

                nextWindow.document.open();
                nextWindow.document.write(childHTML);
                nextWindow.document.close();
                \(webSpatialSetupScript(forWindow: "nextWindow"))
                setChildWindow(nextWindow);
                postProbe({ label, scope: "window-open", type: "opened-child", reason, childLabel: "\(childLabel)" });
              }, [childWindow]);

              React.useEffect(() => {
                const id = setTimeout(() => openChildWindow("auto"), 300);
                return () => clearTimeout(id);
              }, [openChildWindow]);

              return React.createElement(
                React.Fragment,
                null,
                React.createElement("div", null, React.createElement("strong", null, "React portal root")),
                React.createElement(ProbeButton, { label: "\(rootLabel)" }),
                childWindow
                  ? ReactDOM.createPortal(
                      React.createElement(ProbeButton, { label: "\(childLabel)" }),
                      childWindow.document.body,
                    )
                  : null,
              );
            }

            function bootReactPortalProbe() {
              if (!window.React || !window.ReactDOM) {
                postProbe({ label, scope: "boot", type: "react-not-loaded" });
                return;
              }
              ReactDOM.createRoot(document.body).render(React.createElement(App));
              postProbe({ label, scope: "boot", type: "react-rendered" });
            }

            if (document.readyState === "loading") {
              document.addEventListener("DOMContentLoaded", bootReactPortalProbe, { once: true });
            } else {
              bootReactPortalProbe();
            }
            """,
            loadReact: true,
            emptyBody: true
        )
    }

    static func jsStringLiteral(_ value: String) -> String {
        guard
            let data = try? JSONSerialization.data(withJSONObject: [value], options: []),
            let json = String(data: data, encoding: .utf8)
        else {
            return #""""#
        }

        return String(json.dropFirst().dropLast()).replacingOccurrences(of: "</script>", with: "<\\/script>")
    }
}

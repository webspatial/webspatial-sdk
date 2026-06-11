#!/usr/bin/env python3
"""Programmatic WebSpatial debugging on the visionOS Simulator via iwdp.

Each SpatialDiv is a separate WKWebView. Inspector titles match `data-name` when set.
iOS 12+ WebKit requires wrapping CDP calls in Target.sendMessageToTarget (handled here).

Quick start:
  python3 tools/scripts/iwdp-sim.py list
  python3 tools/scripts/iwdp-sim.py launch --route dropdown-menu-spatial
  python3 tools/scripts/iwdp-sim.py click "Dropdown Scenario 3 Parent" "[aria-label='user-menu']"
  python3 tools/scripts/iwdp-sim.py dom "Dropdown Scenario 3 Parent" "[role=menu]" --rect
  python3 tools/scripts/iwdp-sim.py screenshot /tmp/avp.png

See tools/scripts/IWDP-SIM.md for the full guide (humans + AI agents).
"""

from __future__ import annotations

import argparse
import glob
import json
import os
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

try:
    from websocket import create_connection
except ImportError as exc:  # pragma: no cover - dev utility
    raise SystemExit(
        "websocket-client is required. Install with: python3 -m pip install websocket-client"
    ) from exc

IWDP_BIN = os.environ.get("IWDP_BIN", "ios_webkit_debug_proxy")
DEVICE_PORT = int(os.environ.get("IWDP_DEVICE_PORT", "9222"))
DEFAULT_BUNDLE = os.environ.get("WEBSPATIAL_BUNDLE_ID", "com.webspatial.test")
DEFAULT_DEV_ORIGIN = os.environ.get("WEBSPATIAL_DEV_ORIGIN", "http://localhost:5173")
IWDP_PROC: subprocess.Popen[str] | None = None


# ---------------------------------------------------------------------------
# iwdp lifecycle
# ---------------------------------------------------------------------------


def start_iwdp() -> None:
    global IWDP_PROC
    if urllib_ping(f"http://127.0.0.1:{DEVICE_PORT}/json/list"):
        return

    sockets = (
        [os.environ["IWDP_SIM_SOCKET"]]
        if os.environ.get("IWDP_SIM_SOCKET")
        else sorted(glob.glob("/private/tmp/**/com.apple.webinspectord_sim.socket", recursive=True))
    )
    if not sockets:
        raise SystemExit(
            "No com.apple.webinspectord_sim.socket found. Boot the visionOS simulator first."
        )

    errors: list[str] = []
    for sock in reversed(sockets):
        IWDP_PROC = subprocess.Popen(
            [IWDP_BIN, "-F", "-s", f"unix:{sock}"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        for _ in range(40):
            if urllib_ping(f"http://127.0.0.1:{DEVICE_PORT}/json/list"):
                return
            if IWDP_PROC.poll() is not None:
                errors.append(f"{sock}: exited({IWDP_PROC.returncode})")
                IWDP_PROC = None
                break
            time.sleep(0.25)
        else:
            if IWDP_PROC and IWDP_PROC.poll() is None:
                IWDP_PROC.terminate()
                IWDP_PROC = None
            errors.append(f"{sock}: timeout")

    raise SystemExit(
        "Could not start ios_webkit_debug_proxy.\n"
        + "\n".join(errors)
        + "\nTip: export IWDP_SIM_SOCKET=/private/tmp/.../com.apple.webinspectord_sim.socket"
    )


def cleanup(_signum: int | None = None, _frame: object | None = None) -> None:
    global IWDP_PROC
    if IWDP_PROC and IWDP_PROC.poll() is None:
        IWDP_PROC.terminate()
        try:
            IWDP_PROC.wait(timeout=3)
        except subprocess.TimeoutExpired:
            IWDP_PROC.kill()
    IWDP_PROC = None


def urllib_ping(url: str) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=1) as resp:
            resp.read(1)
        return True
    except (urllib.error.URLError, TimeoutError):
        return False


# ---------------------------------------------------------------------------
# WebKit remote debugging (Target.sendMessageToTarget)
# ---------------------------------------------------------------------------


def fetch_pages() -> list[dict[str, Any]]:
    with urllib.request.urlopen(f"http://127.0.0.1:{DEVICE_PORT}/json/list", timeout=5) as resp:
        return json.load(resp)


def find_page(title: str) -> dict[str, Any]:
    pages = fetch_pages()
    matches = [p for p in pages if p.get("title") == title]
    if not matches:
        titles = [p.get("title", "?") for p in pages]
        raise SystemExit(f"Page {title!r} not found. Available: {titles}")
    return matches[0]


def find_webspatial_page(route_hint: str | None = None) -> dict[str, Any]:
    pages = [p for p in fetch_pages() if p.get("title") == "WebSpatial"]
    if not pages:
        raise SystemExit('No WebSpatial page found. Run "launch" first or open the app in the simulator.')
    if route_hint:
        hinted = [p for p in pages if route_hint in (p.get("url") or "")]
        if hinted:
            return hinted[0]
    return pages[0]


def send_to_target(ws, target_id: str, method: str, params: dict | None = None) -> dict:
    inner_id = int(time.time() * 1000) % 1_000_000
    inner = {"id": inner_id, "method": method, "params": params or {}}
    outer = {
        "id": inner_id,
        "method": "Target.sendMessageToTarget",
        "params": {
            "id": inner_id,
            "targetId": target_id,
            "message": json.dumps(inner),
        },
    }
    ws.send(json.dumps(outer))
    deadline = time.time() + 15
    while time.time() < deadline:
        raw = ws.recv()
        data = json.loads(raw)
        if data.get("method") != "Target.dispatchMessageFromTarget":
            continue
        inner_resp = json.loads(data["params"]["message"])
        if inner_resp.get("id") == inner_id:
            return inner_resp
    return {"error": "timeout"}


def eval_raw(title: str, expression: str) -> dict:
    page = find_page(title)
    ws_url = page["webSocketDebuggerUrl"]
    ws = create_connection(ws_url, timeout=15)
    ws.settimeout(15)
    target_id = None
    try:
        while target_id is None:
            data = json.loads(ws.recv())
            if (
                data.get("method") == "Target.targetCreated"
                and data.get("params", {}).get("targetInfo", {}).get("type") == "page"
            ):
                target_id = data["params"]["targetInfo"]["targetId"]
        send_to_target(ws, target_id, "Runtime.enable")
        return send_to_target(
            ws,
            target_id,
            "Runtime.evaluate",
            {"expression": expression, "returnByValue": True, "awaitPromise": True},
        )
    finally:
        ws.close()


def eval_value(title: str, expression: str) -> Any:
    result = eval_raw(title, expression)
    if "error" in result:
        raise SystemExit(json.dumps(result, indent=2))
    value = result.get("result", {}).get("result", {}).get("value")
    if result.get("result", {}).get("result", {}).get("wasThrown"):
        raise SystemExit(json.dumps(result, indent=2))
    return value


def js_str(value: str) -> str:
    return json.dumps(value)


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------


def cmd_list(args: argparse.Namespace) -> None:
    pages = fetch_pages()
    if args.json:
        print(json.dumps(pages, indent=2))
        return
    for page in pages:
        print(
            f"{page.get('title', '?'):40} "
            f"{(page.get('url') or '')[:80]:80} "
            f"{page.get('webSocketDebuggerUrl', '')}"
        )


def cmd_eval(args: argparse.Namespace) -> None:
    print(json.dumps(eval_raw(args.title, args.expression), indent=2))


def cmd_dom(args: argparse.Namespace) -> None:
    selector = js_str(args.selector)
    flags = {
        "html": args.html,
        "text": args.text,
        "rect": args.rect,
        "attr": js_str(args.attr) if args.attr else "null",
        "all": args.all,
    }
    expr = f"""(() => {{
  const sel = {selector};
  const nodes = {json.dumps(args.all)} ? [...document.querySelectorAll(sel)] : [document.querySelector(sel)];
  const map = (el) => {{
    if (!el) return null;
    const out = {{ tag: el.tagName, id: el.id || null, className: el.className || null }};
    if ({json.dumps(args.text)}) out.text = (el.innerText || '').slice(0, {args.limit});
    if ({json.dumps(args.html)}) out.html = (el.outerHTML || '').slice(0, {args.limit});
    if ({json.dumps(args.rect)}) {{
      const r = el.getBoundingClientRect();
      out.rect = {{ x: r.x, y: r.y, width: r.width, height: r.height }};
    }}
    if ({js_str(args.attr) if args.attr else 'null'}) out.attr = el.getAttribute({js_str(args.attr) if args.attr else 'null'});
    const ds = {{}};
    for (const [k, v] of Object.entries(el.dataset)) ds[k] = v;
    if (Object.keys(ds).length) out.dataset = ds;
    return out;
  }};
  const mapped = nodes.map(map).filter(Boolean);
  return {json.dumps(args.all)} ? mapped : (mapped[0] || null);
}})()"""
    print(json.dumps(eval_value(args.title, expr), indent=2))


def cmd_css(args: argparse.Namespace) -> None:
    props = [p.strip() for p in args.props.split(",") if p.strip()]
    expr = f"""(() => {{
  const el = document.querySelector({js_str(args.selector)});
  if (!el) return null;
  const cs = getComputedStyle(el);
  const out = {{}};
  for (const p of {json.dumps(props)}) out[p] = cs.getPropertyValue(p) || cs[p];
  return out;
}})()"""
    print(json.dumps(eval_value(args.title, expr), indent=2))


def cmd_click(args: argparse.Namespace) -> None:
    expr = f"""(() => {{
  const el = document.querySelector({js_str(args.selector)});
  if (!el) return {{ ok: false, reason: 'not found' }};
  el.dispatchEvent(new PointerEvent('pointerdown', {{ bubbles: true }}));
  el.dispatchEvent(new PointerEvent('pointerup', {{ bubbles: true }}));
  el.click();
  return {{ ok: true, tag: el.tagName }};
}})()"""
    print(json.dumps(eval_value(args.title, expr), indent=2))
    if args.wait_ms > 0:
        time.sleep(args.wait_ms / 1000)


def cmd_probe(args: argparse.Namespace) -> None:
    prefix = js_str(args.prefix)
    expr = f"""(() => {{
  const out = [];
  for (const el of document.querySelectorAll('*')) {{
    for (const [k, v] of Object.entries(el.dataset)) {{
      if (k.startsWith({prefix})) out.push({{ tag: el.tagName, key: k, value: v }});
    }}
  }}
  return out;
}})()"""
    value = eval_value(args.title, expr)
    if args.key:
        for item in value or []:
            if item.get("key") == args.key:
                print(item.get("value"))
                return
        raise SystemExit(f"dataset key {args.key!r} not found on {args.title!r}")
    print(json.dumps(value, indent=2))


def cmd_route(args: argparse.Namespace) -> None:
    fragment = args.route if args.route.startswith("#") else f"#{args.route}"
    page = find_webspatial_page(route_hint=fragment.lstrip("#"))
    expr = f"(() => {{ location.hash = {js_str(fragment)}; return location.href; }})()"
    href = eval_value(page.get("title", "WebSpatial"), expr)
    print(href)
    if args.wait_title:
        cmd_wait(argparse.Namespace(title=args.wait_title, timeout=args.timeout, json=False))


def cmd_wait(args: argparse.Namespace) -> None:
    deadline = time.time() + args.timeout
    while time.time() < deadline:
        titles = [p.get("title") for p in fetch_pages()]
        if args.title in titles:
            if args.json:
                print(json.dumps(find_page(args.title), indent=2))
            else:
                print(f"found: {args.title}")
            return
        time.sleep(0.5)
    raise SystemExit(f"Timed out waiting for page {args.title!r}")


def cmd_screenshot(args: argparse.Namespace) -> None:
    path = os.path.abspath(args.path)
    subprocess.run(
        ["xcrun", "simctl", "io", args.device, "screenshot", path],
        check=True,
    )
    print(path)


def build_spatial_url(route: str, origin: str) -> str:
    fragment = route if route.startswith("#") else f"#{route}"
    if not fragment.startswith("#/"):
        fragment = f"#/{fragment.lstrip('#/')}"
    page_url = f"{origin.rstrip('/')}/{fragment}"
    return f"web+spatial://test?cmd={urllib.parse.quote(page_url, safe='')}"


def cmd_launch(args: argparse.Namespace) -> None:
    if args.terminate:
        subprocess.run(
            ["xcrun", "simctl", "terminate", args.device, args.bundle],
            stderr=subprocess.DEVNULL,
            check=False,
        )
        time.sleep(1)
    subprocess.run(["xcrun", "simctl", "launch", args.device, args.bundle], check=True)
    time.sleep(args.launch_delay)
    if args.route:
        spatial_url = build_spatial_url(args.route, args.origin)
        subprocess.run(["xcrun", "simctl", "openurl", args.device, spatial_url], check=True)
        print(spatial_url)
        time.sleep(args.route_delay)
    if args.wait_title:
        cmd_wait(
            argparse.Namespace(title=args.wait_title, timeout=args.wait_timeout, json=False)
        )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="WebSpatial visionOS simulator debugging via ios-webkit-debug-proxy",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Full guide: tools/scripts/IWDP-SIM.md",
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_list = sub.add_parser("list", help="List inspectable WKWebView targets")
    p_list.add_argument("--json", action="store_true", help="Emit JSON")
    p_list.set_defaults(func=cmd_list)

    p_eval = sub.add_parser("eval", help="Evaluate JavaScript in a target webview")
    p_eval.add_argument("title", help="Inspector title (usually SpatialDiv data-name)")
    p_eval.add_argument("expression", help="JavaScript expression")
    p_eval.set_defaults(func=cmd_eval)

    p_dom = sub.add_parser("dom", help="Query DOM in a target webview")
    p_dom.add_argument("title")
    p_dom.add_argument("selector", help="CSS selector")
    p_dom.add_argument("--text", action="store_true", help="Include innerText (truncated)")
    p_dom.add_argument("--html", action="store_true", help="Include outerHTML (truncated)")
    p_dom.add_argument("--rect", action="store_true", help="Include getBoundingClientRect()")
    p_dom.add_argument("--attr", help="Read a single attribute")
    p_dom.add_argument("--all", action="store_true", help="querySelectorAll instead of querySelector")
    p_dom.add_argument("--limit", type=int, default=2000, help="Max text/html length")
    p_dom.set_defaults(func=cmd_dom)

    p_css = sub.add_parser("css", help="Read computed styles for a selector")
    p_css.add_argument("title")
    p_css.add_argument("selector")
    p_css.add_argument(
        "--props",
        default="display,visibility,opacity,width,height,position,transform",
        help="Comma-separated CSS properties",
    )
    p_css.set_defaults(func=cmd_css)

    p_click = sub.add_parser("click", help="Pointer-click a selector (Radix-friendly)")
    p_click.add_argument("title")
    p_click.add_argument("selector")
    p_click.add_argument("--wait-ms", type=int, default=0, help="Sleep after click")
    p_click.set_defaults(func=cmd_click)

    p_probe = sub.add_parser("probe", help="List data-* debug probes (dataset) in a webview")
    p_probe.add_argument("title")
    p_probe.add_argument("key", nargs="?", help="Print one dataset key value, e.g. webspatialOverlayPush")
    p_probe.add_argument("--prefix", default="webspatial", help="Dataset key prefix filter")
    p_probe.set_defaults(func=cmd_probe)

    p_route = sub.add_parser("route", help="Navigate the WebSpatial app via location.hash")
    p_route.add_argument("route", help="Hash route, e.g. dropdown-menu-spatial or #/foo")
    p_route.add_argument("--wait-title", help="Wait until this inspector title appears")
    p_route.add_argument("--timeout", type=float, default=30)
    p_route.set_defaults(func=cmd_route)

    p_wait = sub.add_parser("wait", help="Wait until an inspector title appears")
    p_wait.add_argument("title")
    p_wait.add_argument("--timeout", type=float, default=30)
    p_wait.add_argument("--json", action="store_true")
    p_wait.set_defaults(func=cmd_wait)

    p_shot = sub.add_parser("screenshot", help="Capture simulator screenshot")
    p_shot.add_argument("path", nargs="?", default="/tmp/webspatial-avp.png")
    p_shot.add_argument("--device", default="booted")
    p_shot.set_defaults(func=cmd_screenshot)

    p_launch = sub.add_parser("launch", help="Launch WebSpatial test app and optional route")
    p_launch.add_argument("--bundle", default=DEFAULT_BUNDLE)
    p_launch.add_argument("--device", default="booted")
    p_launch.add_argument("--origin", default=DEFAULT_DEV_ORIGIN)
    p_launch.add_argument("--route", help="Hash route to open via web+spatial deep link")
    p_launch.add_argument("--terminate", action="store_true", help="Terminate app before launch")
    p_launch.add_argument("--launch-delay", type=float, default=2)
    p_launch.add_argument("--route-delay", type=float, default=8)
    p_launch.add_argument("--wait-title", help="Wait for SpatialDiv title after route open")
    p_launch.add_argument("--wait-timeout", type=float, default=30)
    p_launch.set_defaults(func=cmd_launch)

    args = parser.parse_args()
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)
    needs_iwdp = args.cmd not in {"screenshot", "launch"}
    if needs_iwdp:
        start_iwdp()
    try:
        args.func(args)
    finally:
        if needs_iwdp and os.environ.get("IWDP_KEEP_ALIVE") != "1":
            cleanup()


if __name__ == "__main__":
    main()

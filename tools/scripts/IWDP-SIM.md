# WebSpatial AVP Simulator — Programmatic Debugging (`iwdp-sim.py`)

Drive **WebSpatial apps in the Apple Vision Pro simulator** without Safari UI clicks or coordinate tapping. Works for `apps/test-server` and **any WebSpatial app** that exposes WKWebViews with stable `data-name` titles.

## Mental model

```text
visionOS Simulator
  └─ WebSpatial host app (e.g. com.webspatial.test)
       ├─ WebSpatial WKWebView     ← app shell / route page (title: "WebSpatial")
       ├─ SpatialDiv WKWebView A     ← title = data-name on enable-xr surface
       ├─ SpatialDiv WKWebView B
       └─ ...
```

- **One SpatialDiv = one WKWebView** (same as Safari **Develop** menu).
- **`data-name` on `enable-xr`** → Safari / iwdp inspector **title** for that webview.
- Without `data-name`, targets show as `about:blank` and are hard to tell apart.
- Each webview has its **own `window`**. Events and `console.log` do **not** cross webviews.

## Prerequisites

```bash
# Homebrew (once)
brew install ios-webkit-debug-proxy

# Python websocket client (once)
python3 -m pip install websocket-client

# Simulator booted; dev server running for local pages
npm run dev   # from repo root, serves localhost:5173
```

Optional env vars:

| Variable | Default | Purpose |
|----------|---------|---------|
| `IWDP_SIM_SOCKET` | auto-discover | Force a specific `com.apple.webinspectord_sim.socket` |
| `IWDP_KEEP_ALIVE=1` | off | Keep iwdp running between commands |
| `WEBSPATIAL_BUNDLE_ID` | `com.webspatial.test` | App bundle for `launch` |
| `WEBSPATIAL_DEV_ORIGIN` | `http://localhost:5173` | Dev server origin for deep links |

## Quick start (test-server)

```bash
# Terminal A: dev server
npm run dev

# Terminal B: drive simulator
python3 tools/scripts/iwdp-sim.py launch --terminate --route dropdown-menu-spatial \
  --wait-title "Dropdown Scenario 3 Parent"

python3 tools/scripts/iwdp-sim.py list

python3 tools/scripts/iwdp-sim.py click "Dropdown Scenario 3 Parent" "[aria-label='user-menu']" --wait-ms 2000

python3 tools/scripts/iwdp-sim.py dom "Dropdown Scenario 3 Parent" "[role=menu]" --rect --text

python3 tools/scripts/iwdp-sim.py screenshot /tmp/avp-check.png
```

## Command reference

All commands auto-start `ios_webkit_debug_proxy` against the simulator socket (unless noted).

### `list` — discover webviews

```bash
python3 tools/scripts/iwdp-sim.py list
python3 tools/scripts/iwdp-sim.py list --json
```

Pick targets by **title** (left column). Example titles:

```text
WebSpatial                               http://localhost:5173/#/dropdown-menu-spatial
Dropdown Scenario 3 Parent               about:blank
Dropdown Scenario 3 Menu                 about:blank
```

### `launch` — open app + route (no iwdp required)

```bash
python3 tools/scripts/iwdp-sim.py launch --terminate --route dropdown-menu-spatial
python3 tools/scripts/iwdp-sim.py launch --bundle com.your.app --route my-page --origin http://localhost:3000
```

Uses `web+spatial://…?cmd=<encoded-url>` deep link. **URL query params on the hash may be stripped** by the host app; prefer route aliases in the app router when you need deterministic entry.

### `route` — change hash route in WebSpatial webview

```bash
python3 tools/scripts/iwdp-sim.py route dropdown-menu-spatial --wait-title "Dropdown Scenario 2 Parent"
```

### `wait` — block until a SpatialDiv title appears

```bash
python3 tools/scripts/iwdp-sim.py wait "Dropdown Scenario 3 Menu" --timeout 30
```

### `eval` — arbitrary JavaScript

```bash
python3 tools/scripts/iwdp-sim.py eval "Dropdown Scenario 3 Parent" \
  "document.querySelector('[role=menu]') !== null"
```

Uses WebKit **Target.sendMessageToTarget** (required on iOS 12+ / visionOS). Returns full CDP JSON.

### `click` — pointer + click (Radix / dropdown friendly)

```bash
python3 tools/scripts/iwdp-sim.py click "Dropdown Scenario 3 Parent" "[aria-label='user-menu']" --wait-ms 2000
```

`simctl tap` and macOS UI scripting **do not work** on visionOS for this; drive UI via webview JS.

### `dom` — HTML / text / layout / dataset

```bash
python3 tools/scripts/iwdp-sim.py dom "Dropdown Scenario 3 Parent" "[role=menu]" --rect --text
python3 tools/scripts/iwdp-sim.py dom "Dropdown Scenario 3 Parent" "[data-testid='floating-menu-content']" --html --limit 500
python3 tools/scripts/iwdp-sim.py dom "Dropdown Scenario 3 Parent" "[aria-label='user-menu']" --attr aria-expanded
```

Always includes `dataset` keys when present (useful for dev probes).

### `css` — computed styles

```bash
python3 tools/scripts/iwdp-sim.py css "Dropdown Scenario 3 Parent" "[role=menu]" \
  --props display,visibility,opacity,width,height,transform
```

### `probe` — read `data-webspatial-*` dev probes

SDK / demos may expose AVP-friendly probes on DOM (iwdp cannot read WebKit console).

```bash
python3 tools/scripts/iwdp-sim.py probe "Dropdown Scenario 3 Parent"
python3 tools/scripts/iwdp-sim.py probe "Dropdown Scenario 3 Parent" webspatialOverlayPush
# → 220x449:visible:true
```

### `screenshot` — visual assertion (no iwdp)

```bash
python3 tools/scripts/iwdp-sim.py screenshot /tmp/avp.png
```

## What you can and cannot automate

| Capability | Supported | Notes |
|------------|-----------|-------|
| List webviews | Yes | `list` |
| DOM / HTML | Yes | `dom`, `eval` |
| CSS / computed style | Yes | `css`, `eval` + `getComputedStyle` |
| Layout / rects | Yes | `dom --rect` |
| Click / toggle UI | Yes | `click` or `eval` in the **correct** webview |
| Route navigation | Yes | `route` / `launch` |
| Screenshots | Yes | `screenshot` |
| **`console.log` via iwdp** | **No** | WebKit does not emit `Console.messageAdded` through this bridge |
| Cross-webview `window` events | No | Use DOM probes or per-webview `eval` |
| `simctl tap` on visionOS | No | Use webview JS instead |

### Console alternative (recommended for AVP gates)

When you need log-like acceptance criteria in automation:

1. **Mirror to page UI** — write to a visible `<pre>` / status line (screenshot-readable).
2. **DOM dataset probes** — e.g. `data-webspatial-overlay-push` (read with `probe`).
3. **Global hook** — `window.__yourProbe = (detail) => …` called from SDK dev paths.
4. **Safari Web Inspector** — manual only; not scriptable via iwdp.

## Adopting in another WebSpatial app

1. **Add `data-name`** to every SpatialDiv you need to distinguish:

   ```tsx
   <div enable-xr data-name="Checkout Panel">…</div>
   <div enable-xr data-name="Checkout Menu">…</div>
   ```

2. **Set bundle / origin** if not using test-server:

   ```bash
   export WEBSPATIAL_BUNDLE_ID=com.yourcompany.yourapp
   export WEBSPATIAL_DEV_ORIGIN=http://localhost:3000
   ```

3. **Launch and list**:

   ```bash
   python3 tools/scripts/iwdp-sim.py launch --route your-route --wait-title "Checkout Panel"
   python3 tools/scripts/iwdp-sim.py list
   ```

4. **Drive and assert** in the webview that owns the DOM you care about (usually the SpatialDiv title, not always `WebSpatial`).

5. **Optional: add dev-only probes** for values you used to check in console (sizes, `visible`, sync flags).

## AI agent playbook

Copy this checklist into agent prompts:

```text
1. Ensure simulator booted + dev server URL reachable from simulator.
2. python3 tools/scripts/iwdp-sim.py launch --terminate --route <route> --wait-title "<SpatialDiv data-name>"
3. python3 tools/scripts/iwdp-sim.py list   # confirm titles
4. Drive state in the SpatialDiv webview (not WebSpatial shell unless routing):
   - click / eval / dom / css on title "<data-name>"
5. python3 tools/scripts/iwdp-sim.py screenshot /tmp/step.png
6. Assert via dom/probe JSON + screenshot; do NOT rely on console.log over iwdp.
7. Use IWDP_KEEP_ALIVE=1 when running multiple commands in one shell session.
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `No com.apple.webinspectord_sim.socket` | Boot Apple Vision Pro simulator in Xcode |
| `Could not start ios_webkit_debug_proxy` | `export IWDP_SIM_SOCKET=$(find /private/tmp -name com.apple.webinspectord_sim.socket \| tail -1)` |
| Empty `list` | Open the WebSpatial app first; load a page with SpatialDivs |
| `Page 'Foo' not found` | Run `list`; fix `data-name` typo; `wait "Foo"` after route |
| Click returns ok but menu closed | Add `--wait-ms 2000`; re-check with `dom … --attr aria-expanded` |
| `WebSpatial` has no demo DOM | Normal — app shell webview; use SpatialDiv titles for portal DOM |
| Two `WebSpatial` entries | `route` picks URL matching the hash; or pass exact title via `eval` after `list --json` |

## Related docs

- Safari manual debugging: `~/.codex/skills/webspatial-visionos-debugging/SKILL.md` (Develop menu workflow)
- Portal architecture: `packages/react/src/spatialized-container/ARCHITECTURE.md`
- Agent skill (repo): `.codex/skills/webspatial-avp-iwdp/SKILL.md`

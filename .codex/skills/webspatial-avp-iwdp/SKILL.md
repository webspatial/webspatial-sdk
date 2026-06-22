---
name: webspatial-avp-iwdp
description: Programmatic WebSpatial debugging on the Apple Vision Pro simulator via ios-webkit-debug-proxy and tools/scripts/iwdp-sim.py. Use when automating AVP simulator tests, driving SpatialDiv WKWebViews without Safari clicks, reading DOM/CSS from portal webviews, or debugging any WebSpatial app (not only test-server). Triggers on iwdp, ios-webkit-debug-proxy, visionOS simulator automation, data-name inspector targets, SpatialDiv webview eval, or AVP screenshot gates.
---

# WebSpatial AVP — iwdp automation

## Read first

Full guide: [tools/scripts/IWDP-SIM.md](../../../tools/scripts/IWDP-SIM.md)

Script: `python3 tools/scripts/iwdp-sim.py`

## Core model (must internalize)

- Each **`enable-xr` SpatialDiv** = separate **WKWebView** in Safari Develop / iwdp.
- **`data-name`** → inspector **title** (use unique stable names).
- **`WebSpatial` title** = host app webview (often sidebar shell); **portal DOM lives in SpatialDiv titles**.
- **No `simctl tap`** on visionOS; **no iwdp `console.log`** — use `dom` / `probe` / page-log mirrors.

## Standard agent workflow

```bash
# 1. Dev server running (adjust origin for other apps)
npm run dev

# 2. Launch app + route + wait for SpatialDiv
python3 tools/scripts/iwdp-sim.py launch --terminate --route <route> \
  --wait-title "<SpatialDiv data-name>"

# 3. Discover targets
python3 tools/scripts/iwdp-sim.py list

# 4. Drive UI in the correct webview (SpatialDiv title, not WebSpatial)
python3 tools/scripts/iwdp-sim.py click "<data-name>" "<css-selector>" --wait-ms 2000

# 5. Read DOM / CSS / probes
python3 tools/scripts/iwdp-sim.py dom "<data-name>" "<selector>" --rect --text
python3 tools/scripts/iwdp-sim.py css "<data-name>" "<selector>"
python3 tools/scripts/iwdp-sim.py probe "<data-name>" webspatialOverlayPush

# 6. Visual check
python3 tools/scripts/iwdp-sim.py screenshot /tmp/avp.png
```

Multi-step shells: `export IWDP_KEEP_ALIVE=1`

## Other WebSpatial apps

```bash
export WEBSPATIAL_BUNDLE_ID=com.your.app
export WEBSPATIAL_DEV_ORIGIN=http://localhost:3000
python3 tools/scripts/iwdp-sim.py launch --route your-hash-route --wait-title "Your Panel"
```

App code: add `data-name` on every SpatialDiv you need to automate.

## Assertions — prefer these over console

| Need | Command |
|------|---------|
| Element exists | `dom … "[selector]"` |
| Layout | `dom … --rect` |
| Styles | `css …` |
| Dev probe | `probe … <datasetKey>` |
| Visual | `screenshot` + image review |
| Arbitrary | `eval …` |

Do **not** expect `Console.messageAdded` over iwdp on WebKit.

## When stuck

1. Run `list` — titles wrong → fix `data-name` or `wait`.
2. iwdp won't start → boot simulator; set `IWDP_SIM_SOCKET` (see IWDP-SIM.md).
3. Click ineffective → `--wait-ms 2000`; use Pointer-friendly `click` subcommand.
4. Wrong webview → match **title** from `list`, not guessed `WebSpatial`.

Manual Safari path (human): skill `webspatial-visionos-debugging`.

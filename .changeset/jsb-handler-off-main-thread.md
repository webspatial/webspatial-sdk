---
'@webspatial/platform-visionos': patch
---

visionOS: parse and decode JSB messages off the main thread. `JSBManager.handlerMessage` now returns immediately and does its envelope splitting and JSON decoding on a serial background queue, so large command payloads no longer block rendering or input. Registered handlers still run on the main actor, replies are always delivered on the main thread, and commands keep the order the web layer sent them in.

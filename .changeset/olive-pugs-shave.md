---
'@webspatial/platform-visionos': patch
---

Decode JSB command payloads off the main thread

Blob transfers for `<Model>` sources ship megabytes of Base64 across the bridge, and `JSBManager` parsed every message on the main thread — the same thread that runs `scrollViewDidScroll` and the SwiftUI layout pass for spatialized elements. Loading a model from a `blob:` URL therefore dropped scroll frames for the duration of the transfer.

Command payloads are now sliced and JSON-decoded on a serial background queue, leaving only a bounded header scan and the handler lookup on the main thread. The queue is serial, so commands still execute in arrival order, and replies still land on the main thread.

Splitting on the first `::` rather than requiring exactly one occurrence also fixes commands whose payload legitimately contains `::`, such as a `StartBlobTransfer` from a page served over an IPv6 origin.

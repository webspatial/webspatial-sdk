---
"@webspatial/platform-visionos": patch
---

Ensure WKWebView instances are fully torn down during SwiftUI `UIViewRepresentable` dismantle so orphaned Inspectable WebViews do not persist after scene destruction.


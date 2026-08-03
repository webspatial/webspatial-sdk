---
'@webspatial/platform-visionos': patch
---

Recreate the spatial scene when visionOS `WindowGroup` window data references a missing scene ID, instead of force-unwrapping nil. Read volume resize limits from the active scene config after recreation.

---
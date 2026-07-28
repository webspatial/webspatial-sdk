---
'@webspatial/core-sdk': patch
---

Fix attachments failing to load on new picoOS runtimes (PicoWebApp/0.4.90 OTA0+) by sending the placement-shaped attachment payload they expect, detected via `supports('AttachmentEntity', ['placement'])`. No API change; visionOS and older runtimes are unaffected.

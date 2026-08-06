---
'@webspatial/core-sdk': minor
'@webspatial/react-sdk': minor
'@webspatial/platform-visionos': minor
---

Add `cornerRadius` and `backgroundMaterial` to Attachment entities. The public API takes a single number radius (expanded internally to the four-corner shape) and the documented material values ('none' | 'transparent' | 'translucent' | 'thin' | 'regular' | 'thick'). Invalid radii normalize to 0, invalid materials to 'transparent', and both properties update in place without recreating the attachment WebView. visionOS applies the same material-and-corner surface modifier used by Ornaments.

---
'@webspatial/react-sdk': major
---

BREAKING: rename `<AttachmentAsset>`'s `name` prop to `id` to align attachment asset declarations with other asset APIs such as `<ModelAsset id="...">`.

Update declarations from `<AttachmentAsset name="hud">` to `<AttachmentAsset id="hud">`. `<AttachmentEntity attachment="hud">` continues to reference the matching asset id, and the existing size and tuple position API is unchanged.

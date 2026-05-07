# WebSpatial Quirks

This document records abnormal behaviours that normal web developers would not expect when running inside the WebSpatial runtime. Each section describes one quirk, the root cause, and the polyfill/workaround applied.

## Anchor Navigation

The scene polyfill installs a document click handler via `hijackWindowATag(...)` to handle navigation for anchor tags in a controlled way.

### What It Does

- It listens to `document.onclick` and walks up the DOM tree from the event target to find the nearest `<a>` element.
- If the anchor has a `target` and `target !== '_self'`, it prevents the default navigation and calls `window.open(url, target)`.
- If no special handling is needed, it lets the browser behavior continue.

### Nested Clicks

Clicks often originate from a nested element inside an anchor, for example:

```html
<a href="https://example.com" target="_blank">
  <img src="..." />
</a>
```

In this case the `event.target` is the `<img>`, not the `<a>`. The polyfill therefore uses the anchor found during event bubbling rather than relying on `event.target` being the anchor itself.

---
'@webspatial/react-sdk': patch
---

Fix portal head style sync for CSS-in-JS (e.g. styled-components). Serialize `style.sheet.cssRules` when syncing parent styles into portal windows, update portal `<style>` nodes in place, incrementally mirror parent rules via `insertRule`/`deleteRule`, observe parent head style text changes even for portal callers that opt out of subtree observation, re-sync before portal re-rendering after 2D-frame updates, and coalesce active portal syncs through a singleton parent-head registry that captures one parent head snapshot per broadcast wave.

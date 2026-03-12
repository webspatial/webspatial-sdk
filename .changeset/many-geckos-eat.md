---
'web-content': patch
'@webspatial/react-sdk': patch
---

Fixed Model ref.current to be stable after initial render

Changes to ref cannot be observed since React doesn't re-render
on ref changes. So ref.current.ready Promise needs to be stable and
immediately available. It should resolve after the 3D model has rendered

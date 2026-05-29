<div align="left">
  <img src="../../assets/logo.png" alt="WebSpatial Logo" width="400"/>
</div>
<br/>

# React SDK for WebSpatial

The React SDK from the WebSpatial SDK makes the WebSpatial API immediately available inside React.

## Documentation

- [Introduction](https://webspatial.dev/docs/introduction)
- [Quick Example](https://webspatial.dev/docs/quick-example)
- [Core Concepts](https://webspatial.dev/docs/core-concepts)
- [Development Guide](https://webspatial.dev/docs/development-guide)

## SpatialDiv `onSpatialContentReady` runtime note

When using nested `SpatialDiv` (`enable-xr`) with `onSpatialContentReady`, callback ordering differs by runtime:

- In WebSpatial runtime, parent `SpatialDiv` callback runs before child callback on the same ready edge.
- In non-WebSpatial fallback (plain web DOM), callback ordering between parent and child is not a guaranteed contract and should be treated as unspecified.

Recommended practice: initialize imperative renderers from each container's own `ctx.host` and avoid coupling setup logic to parent/child callback sequence in fallback web mode.

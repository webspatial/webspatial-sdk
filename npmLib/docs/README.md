**web-spatial** • [**Docs**](globals.md)

***

# Web Spatial

#### Spatial 3D library for the web

An easy-to-use library that allows developers to create content for XR Platforms using standard web technology (eg. html/css/js) that can be extended by good integration with popular libraries like ReactJS, BabylonJS, ThreeJS, etc.

### Usage

This code shows how to create an iframe placed in 3D space as well embed 3D files placed on the page.

#### React API
```html
<Model className="w-full h-full bg-purple-500 bg-opacity-50 rounded-xl text-center">
    <source src="/assets/FlightHelmet.usdz" type="model/vnd.usdz+zip" ></source>
</Model>
<SpatialIFrame src="/index.html" className="" style="" spatialOffset={{ z: 100 }}>
</SpatialIFrame>
```

#### JS/Typescript API
```typescript
import { Spatial, SpatialEntity } from '../../lib/webSpatial'

// Create Session
var spatial = new Spatial()
let session = await spatial.requestSession()

// Create entity on the page at page coordinates
var e = await session.createEntity()
e.transform.position.x = 500
e.transform.position.y = 300
e.transform.position.z = 300
await e.updateTransform()

// Load a spatial iframe element and attach to entity
let i = await session.createIFrameComponent()
await Promise.all([
    i.loadURL("/index.html?pageName=reactDemo/basic.tsx"),
    i.setResolution(300, 300),
    e.setComponent(i)
])

// Animate
var loop = (time: DOMHighResTimeStamp) => {
    session.requestAnimationFrame(loop)
    e.transform.position.x = 500 + Math.sin(time / 1000) * 200
    e.updateTransform()
}
session.requestAnimationFrame(loop)
```

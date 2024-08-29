# Web Spatial

#### Spatial 3D library for the web

An easy-to-use library that allows developers to create content for XR Platforms using standard web technology (eg. html/css/js) that can be extended by good integration with popular libraries like ReactJS, BabylonJS, ThreeJS, etc.

### Full Api Docs
 - **web-spatial JS API** • [**Docs**](/npmLib/docs/globals.md)
 - **web-spatial React API** • [**Docs**](/npmLib/docs/reactComponents/globals.md)

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
import { Spatial, SpatialEntity } from 'web-spatial'

// Create Session
var spatial = new Spatial()
let session = await spatial.requestSession()
var currentWindowGroup = await session.getCurrentWindowGroup()

// Create entity on the page at page coordinates
var e = await session.createEntity()
e.transform.position.x = 500
e.transform.position.y = 300
e.transform.position.z = 300
await e.updateTransform()

// Add to window group to display it
await e.setParentWindowGroup(currentWindowGroup)

// Load a spatial iframe element and attach to entity
let i = await session.createWindowComponent()
await Promise.all([
    i.loadURL("/loadTsx.html?pageName=reactDemo/basic.tsx"),
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

### Contribute/Build locally
###### Build and link web library
`cd npmLib/ && npm run build`
`cd npmLib/ && yarn link`

###### Build and run example website
Build and link the web library (instructions above)
`cd webTests/ && yarn link web-spatial` // Add link to web library
`cd webTests/ && npm run dev -- --host` // Start web server
`http://localhost:5173/` // Observe homepage loads (note 3D content can only be displayed in app at the moment)

###### Run the app to view your website in 3D on VisionOS simulator
 - `cd visionOSApp/ && open web-spatial.xcodeproj/` // Open xcode project and click play
 - To view on a real device, make sure you can open the website in safari (may need to use the network ip address url from example site instead of localhost)
 - Update the url in web_spatialApp.swift in the xcode project to your url
`root = SpatialWebView(parentWindowGroupID: "root", url: URL(string: "http://YOUR_URL")!) `
 - Launch on device and observe it working

###### Generate docs
`cd npmLib/ && npm run genDocs`






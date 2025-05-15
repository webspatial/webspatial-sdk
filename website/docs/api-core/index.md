# **Full API documentation**

* [API Docs](https://github.com/webspatial/webspatial.github.io/blob/main/docs/globals.md)

# **Introduction**

The core-sdk library is responsible for interacting with the target platforms native APIs to expose behavior not commonly found on the web.

# **Hello world example**

```
import { Spatial, SpatialHelper } from '@webspatial/core-sdk'

var main = async () => {
    var spatial = new Spatial()
    var versionInfo = "clientVersion:" + spatial.getClientVersion() + "\nnativeVersion:" + spatial.getNativeVersion() + "\nisSupported:" + spatial.isSupported()
    
    let sh = SpatialHelper.instance!
    if (sh) {
        // Create a new window container
        var container = await sh.session.createWindowContainer({ style: 'Volumetric' })
        
        // Setup volume for the entity
        var rootEntity = await sh.session.createEntity()
        await rootEntity.setCoordinateSpace("Root")
        rootEntity.setComponent(await sh.session.createViewComponent())
        
        // Create a mesh. and add it tot the root volume
        var box = await sh.shape.createShapeEntity("box")
        await box.setParent(rootEntity)
        
        // add the volume to the window
        await container.setRootEntity(rootEntity)
    }
}
main()
```

# **Initialization**

Create a new spatial object which is the root entry point to the API. This object should be available in standard browsers as well as webspatial environments. This object can check client and native versions of the library and detect if webspatial is available in this setup.

```
var spatial = new Spatial()
if(spatial.isSupported()){
  var session = spatial.requestSession()
  if(session){
    console.log("session supported and created")
  }
}
```

# **Async/Await/Promises**

Due to the architecture of webspatial, the client library communicates to native code over a JS Bridge provided by the platform. Because of this, function calls may not be completed immediately. To accomidate this, the majority of webspatial api use [promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) to keep track of completion. It is recommended you create an async main function to allow you to use the await syntax for app setup.

```
var main = async ()=>{
    // Your code goes here
};
main()'
```

# **WindowContainer**

To create a new WindowContainer (aka WindowGroup on apple vision pro)

```
var windowContainer = await session.createWindowContainer({ style: 'Volumetric' })
```

Depending on if you want to display content as a panel or within a volume, you can choose to use "Plain" or "Volumetric" style.

# **Entity/Component api**

To start displaying content within a WindowContainer, you must create an entity.

```
// Create entity
var entity = await session.createEntity()

// Create component
await entity.setComponent(
    await session.createViewComponent({ windowContainer: windowContainer }),
)
await entity.setCoordinateSpace('Root')

// Set root entity on the window container. 
// Note the entity much have:
// - Root coordinate space
// - have a ViewComponent for Volumetric windowContainer
// - have a WindowComponent for Plain windowContainer
await windowContainer.setRootEntity(entity)
```

Entity maps to an object that will be displayed. Components tell how that object should be displayed.  
You can find more examples here when you run the server locally:

* http://localhost:5173/src/docsWebsite/index.html?examplePath=webElement

# **Helper**

This library, similar to (webGL or webXR) may be a bit too verbose to use directly. You can use the helper we provide to do some common tasks such as opening a new webpage panel or use our higher level react API.

```
import { SpatialHelper } from '@webspatial/core-sdk'
SpatialHelper.instance.navigation.openPanel(
    'https://www.npmjs.com/package/@webspatial/core-sdk',
    { resolution: { width: 600, height: 100 } },
)
```

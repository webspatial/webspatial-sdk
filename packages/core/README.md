# WebSpatial Core SDK

> [!NOTE]
> This library is still in development. APIs may change as we enable additional platforms/features.

## Overview

WebSpatial Core SDK is a framework-agnostic pure JavaScript API that enables the WebSpatial App Shell to natively spatialize 2D HTML content and render 3D content. The core-sdk library is responsible for interacting with the target platform's native APIs to expose spatial behaviors not commonly found on the web.

## Installation

```bash
npm install @webspatial/core-sdk
```

## Getting Started

To run a WebSpatial website, you currently need to package it within a native app. See documentation on our [GitHub repository](https://github.com/webspatial/webspatial-sdk) for more information.

### Hello World Example

```javascript
import { Spatial } from '@webspatial/core-sdk'

const main = async () => {
  // Initialize the Spatial environment
  const spatial = new Spatial()
  
  if (spatial.isSupported()) {
    const session = spatial.requestSession()
    if (session) {
      console.log("Session supported and created")
      
      // Now you can create spatial elements
      // Example: Create a 2D element
      const element2D = await session.createSpatialized2DElement()
      
      // Example: Create a 3D static element (for models)
      const static3DElement = await session.createSpatializedStatic3DElement()
      
      // Example: Create a 3D dynamic element (for custom geometry)
      const dynamic3DElement = await session.createSpatializedDynamic3DElement()
    }
  }
}

main()
```

## Core Concepts

### Initialization

Create a new `Spatial` object which is the root entry point to the API. This object should be available in standard browsers as well as WebSpatial environments. It can check client and native versions of the library and detect if WebSpatial is available in your setup.

```javascript
const spatial = new Spatial()
if (spatial.isSupported()) {
  const session = spatial.requestSession()
  if (session) {
    console.log("Session supported and created")
  }
}
```

### Async/Await/Promises

Due to the architecture of WebSpatial, the client library communicates with native code over a JS Bridge provided by the platform. Because of this, function calls may not be completed immediately. To accommodate this, the majority of WebSpatial API uses [promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) to track completion. It is recommended you create an async main function to allow you to use the await syntax for app setup.

```javascript
const main = async () => {
  // Your code goes here
}
main()
```

## Key Components

### SpatialSession

The `SpatialSession` class is used to establish a connection to the spatial renderer of the system. All spatial resources must be created through this session.

```javascript
const session = spatial.requestSession()
```

Key methods include:
- `getSpatialScene()`: Returns the current spatial scene
- `createSpatialized2DElement()`: Creates a 2D element in spatial environment
- `createSpatializedStatic3DElement()`: Creates a static 3D element for models
- `createSpatializedDynamic3DElement()`: Creates a dynamic 3D element for custom geometry

### SpatializedElement

The base class for all spatial elements. It provides common functionality for:

- Updating element properties
- Handling spatial transforms
- Processing spatial events (tap, drag, rotate, magnify)

### Element Types

#### Spatialized2DElement

Represents HTML content in a spatial environment with properties like:
- Corner radius
- Background material type
- Scroll behavior

#### SpatializedStatic3DElement

Represents static 3D models loaded from URLs.

#### SpatializedDynamic3DElement

Represents dynamic 3D content with custom geometry and materials.

## Spatial Geometry and Materials

The SDK provides various geometry types:
- `SpatialBoxGeometry`
- `SpatialPlaneGeometry`
- `SpatialSphereGeometry`
- `SpatialConeGeometry`
- `SpatialCylinderGeometry`

And material options including:
- Background material types: 'none', 'translucent', 'thick', 'regular', 'thin', 'transparent'
- Custom unlit materials

## Event Handling

The SDK supports various spatial events:
- Tap events
- Drag events (start, drag, end)
- Rotate events (start, rotate, end)
- Magnify events (start, magnify, end)

## Advanced Usage

For more advanced usage and detailed API documentation, please refer to the [official documentation](https://github.com/webspatial/webspatial-sdk).

## License

See the LICENSE file in the repository root for more information.
 

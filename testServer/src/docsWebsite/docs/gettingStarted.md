# Getting Started

## Starting a new project

To start you need to have a project that allows you to display a webpage and import npm packages
We recommend following a similar structure as defined in the [React Getting Started Docs](https://react.dev/learn/start-a-new-react-project)

If you are starting from scratch you can start from the nextJS template

```
npx create-next-app@latest
```

## Install packages for js and/or react APIs

```
npm install @webspatial/core-sdk
npm install @webspatial/react-sdk
```

## Import the library in your script and create a session

```javascript
import { Spatial, SpatialSession } from '@webspatial/core-sdk'

let spatial = new Spatial()
let session = spatial.requestSession()
```

Observe in standard browsers, the returned session will be null. For this to succeed, you must use a compatable app to load the webpage

## Launch Apple Vision Pro App

Open xcode project and click play

When viewing your website in the app, session creation should now succeed

Now check out the samples to see how to add xr content to the webpage.

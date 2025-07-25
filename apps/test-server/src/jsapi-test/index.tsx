// import React from 'react'
// import ReactDOM from 'react-dom/client'

import { Spatial } from '@webspatial/core-sdk'

const spatial = new Spatial()
const session = spatial.requestNewSession()
console.log('session', session)
if (session) {
  const spatialScene = session.getSpatialScene()
  spatialScene.updateSpatialMaterial('translucent')
}

// function App() {
//   return (
//     <div className="min-h-screen bg-gray-900/60 text-white p-6">
//        this is jsapi test page
//     </div>
//   )
// }

// // Initialize react
// var root = document.createElement('div')
// document.body.appendChild(root)
// ReactDOM.createRoot(root).render(
//     <App />
// )

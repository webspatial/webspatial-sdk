// @ts-nocheck

// import React from 'react'
// import ReactDOM from 'react-dom/client'

import {
  testCreateSpatialized2DElement,
  testSpatialSceneCorner,
  testSpatialSceneMaterial,
  testCreateSpatializedStatic3DElement,
  testSpatialInspect,
  testSpatialSceneInspect,
} from './jsapi'

testSpatialSceneMaterial()
testSpatialSceneCorner()
testCreateSpatialized2DElement().then(spatialized2DElement => {
  testCreateSpatializedStatic3DElement(spatialized2DElement).then(_ => {})

  testSpatialInspect(spatialized2DElement)
  testSpatialSceneInspect()
})
testSpatialSceneInspect()

// function App() {
//   const style = {
//     width: '100vw',
//     height: '150vh',
//   }
//   return (
//     <div className="min-h-screen bg-gray-900/60 text-white p-6" style={style}>
//       this is jsapi test page
//     </div>
//   )
// }

// // Initialize react
// var root = document.createElement('div')
// document.body.appendChild(root)
// ReactDOM.createRoot(root).render(<App />)

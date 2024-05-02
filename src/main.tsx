import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SpatialWeb } from "../lib/spatialWeb.ts"


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

var main = async () => {
  SpatialWeb.init()
  console.log("webpage start")
  // Get 3D window reference
  var spatialWindow = await SpatialWeb.getCurrentSpatialWindow()

  // Set resolution
  spatialWindow.resolution.x = 1920 / 3
  spatialWindow.resolution.y = 1080

  // Set scale to avoid squishing based on resultion
  let scaleFactor = 0.5
  spatialWindow.scale.x = (spatialWindow.resolution.x / spatialWindow.resolution.y) * scaleFactor
  spatialWindow.scale.y = 1 * scaleFactor
  spatialWindow.scale.z = 1 * scaleFactor

  // Position at the bottom of the volume
  spatialWindow.position.x = 0
  spatialWindow.position.y = -0.5 + (spatialWindow.scale.y / 2)
  spatialWindow.position.z = 0.3 // bring closer to user

  spatialWindow.updateTransform()

  var spatialWindow2 = await SpatialWeb.createNewSpatialWindow("/index2.html")
  // Set resolution
  spatialWindow2.resolution.x = 1920
  spatialWindow2.resolution.y = 1080


  // Set scale to avoid squishing based on resultion
  scaleFactor = 0.2
  spatialWindow2.scale.x = (spatialWindow2.resolution.x / spatialWindow2.resolution.y) * scaleFactor
  spatialWindow2.scale.y = 1 * scaleFactor
  spatialWindow2.scale.z = 1 * scaleFactor

  // Position at the bottom of the volume
  spatialWindow2.position.x = 0.1
  spatialWindow2.position.y = -0.5 + (spatialWindow2.scale.y / 2)
  spatialWindow2.position.z = 0.4 // bring closer to user
  spatialWindow2.updateTransform()
  //setTimeout(() => {
  spatialWindow2.openUrl("/index2.html")
  //}, 100);

  SpatialWeb.onFrame((curTime: number) => {
    spatialWindow2.position.y = Math.sin(curTime / 1000) * 0.5
    spatialWindow2.updateTransform()
  })



}
main()

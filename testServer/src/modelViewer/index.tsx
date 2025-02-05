import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { getSession, Model, SpatialDiv } from '@xrsdk/react'
import { SpatialHelper } from '@xrsdk/runtime/dist'

function App() {
  const [toggle, setToggle] = useState(true)

  useEffect(() => {
    ;(async () => {
      var rootEnt = await getSession()?.getCurrentWindowGroup().getRootEntity()
      var box = await SpatialHelper.instance?.shape.createShapeEntity()!
      if (box) {
        box.setParent(rootEnt!)
        box.transform.scale.x = 0.1
        box.transform.scale.y = 0.1
        box.transform.scale.z = 0.1
        SpatialHelper.instance?.session.addOnEngineUpdateEventListener(
          async time => {
            await SpatialHelper.instance?.session.transaction(() => {
              box.transform.position.x = Math.sin(time / 1000) * 0.1
              box.updateTransform()
            })
          },
        )
      }
    })()
  }, [])

  return (
    <div className="w-screen h-screen flex justify-center items-center">
      hello world
    </div>
  )
}

// Initialize react
var root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
// Force page height to 100% to get centering to work
document.documentElement.style.height = '100%'
document.body.style.height = '100%'
root.style.height = '100%'

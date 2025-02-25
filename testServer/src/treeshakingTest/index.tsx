import React from 'react'
import ReactDOM from 'react-dom/client'
import { SpatialDiv, getSession } from '@xrsdk/react'

const spatialSupported = !!getSession()

if (spatialSupported) {
  const session = getSession()!
  session.getCurrentWindowComponent()
}

function App() {
  const spatialStyle = {
    position: { x: 0, y: 0, z: 10.000001 },
    transparentEffect: true,
    glassEffect: false,
    // materialThickness: "none"
  }

  const divCls = 'text-amber-600	'
  const spaceCls = divCls + 'bg-zinc-400'

  return (
    <div className="w-screen h-screen flex flex-row base-200">
      <div className="text-blue   bg-base-200	bg-clip-border px-6 py-6  ">
        <a href="#" onClick={() => history.go(-1)}>
          Go Back
        </a>
      </div>
      <div className="flex flex-col flex-1">
        <div className="flex flex-row pt-5 gap-2">
          <div className={divCls}> this is div </div>
          <SpatialDiv spatialStyle={spatialStyle} className={spaceCls}>
            this is spatial div
          </SpatialDiv>
        </div>
      </div>
    </div>
  )
}

// await WebSpatial.setWebPanelStyle(WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel())
document.documentElement.style.backgroundColor = 'transparent'
document.body.style.backgroundColor = 'transparent'
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

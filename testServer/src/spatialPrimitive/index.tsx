// @ts-nocheck
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Spatial } from '@xrsdk/runtime'
import { SpatialDiv, SpatialPrimitive, withSpatial } from '@xrsdk/react'
import { SimpleComponent } from './SimpleComponent'

const spatial = new Spatial()
const spatialSupported = spatial.isSupported()

if (spatialSupported) {
  const session = new Spatial().requestSession()
  session
    .getCurrentWindowComponent()
    .setStyle({ material: { type: 'translucent' }, cornerRadius: 50 })
}

const SpatialSimpleComponent = withSpatial(SimpleComponent)

const imgSrc =
  'https://interactive-examples.mdn.mozilla.net/media/examples/firefox-logo.svg'

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
            {' '}
            this is spatial div{' '}
          </SpatialDiv>
        </div>

        <div className="flex flex-row pt-5 gap-2">
          <p className={divCls}> this is p</p>
          <SpatialPrimitive.p spatialStyle={spatialStyle} className={spaceCls}>
            {' '}
            this is spatial p
          </SpatialPrimitive.p>
        </div>

        <div className="flex flex-row pt-5 gap-2">
          <a className={divCls}> this is a</a>
          <SpatialPrimitive.a spatialStyle={spatialStyle} className={spaceCls}>
            {' '}
            this is spatial a
          </SpatialPrimitive.a>
        </div>

        <div className="flex flex-row pt-5 gap-2">
          <SpatialPrimitive.img
            spatialStyle={spatialStyle}
            className={spaceCls}
            src={imgSrc}
            width={200}
          />
        </div>

        <div className="flex flex-row pt-5 gap-2">
          <SimpleComponent className={divCls} />
          <SpatialSimpleComponent
            spatialStyle={spatialStyle}
            className={spaceCls}
          />
        </div>
      </div>
    </div>
  )
}

// await WebSpatial.setWebPanelStyle(WebSpatial.getCurrentWindowContainer(), WebSpatial.getCurrentWebPanel())
document.documentElement.style.backgroundColor = 'transparent'
document.body.style.backgroundColor = 'transparent'
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

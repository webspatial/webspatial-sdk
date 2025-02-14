import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { Spatial } from '@xrsdk/runtime'

//(window as any).wx = WebSpatial

var _panelContentUpdate = ''
;(window as any).updatePanelContent = (str: string) => {
  str = decodeURIComponent(str)
  _panelContentUpdate = str
  if ((window as any).myContentUpdate) {
    ;(window as any).myContentUpdate(_panelContentUpdate)
  }
}

function App() {
  const myDiv = useRef(null)
  useEffect(() => {
    ;(window as any).myContentUpdate = (str: string) => {
      ;(myDiv.current! as HTMLElement).innerHTML = str
    }
    //  (window as any).myContentUpdate(_panelContentUpdate)
  }, [])
  return (
    <div className="w-screen h-screen" ref={myDiv}>
      <div className="text-white bg-purple-500 bg-opacity-10 flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <p className="text-center">Hello world</p>
      </div>
    </div>
  )
}

if (new Spatial().isSupported()) {
  var session = new Spatial().requestSession()
  session!
    .getCurrentWindowComponent()
    .setStyle({ material: { type: 'default' }, cornerRadius: 50 })
}

// await WebSpatial.setWebPanelStyle(WebSpatial.getCurrentWindowContainer(), WebSpatial.getCurrentWebPanel())
document.documentElement.style.backgroundColor = 'transparent'
document.body.style.backgroundColor = 'transparent'
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

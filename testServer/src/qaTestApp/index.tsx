import React from 'react'
import ReactDOM from 'react-dom/client'
import { Spatial } from '@xrsdk/runtime'
import { SpatialDiv } from '@xrsdk/react'

const spatial = new Spatial()
const session = spatial.requestSession()

if (session) {
  session.getCurrentWindowComponent().setStyle({
    material: { type: 'translucent' },
    cornerRadius: 70,
  })
}

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex text-white text-lg bg-black bg-opacity-25 p-4 gap-5">
        <a href="/" className="hover:text-blue-400 transition-colors">
          Return to Home Page
        </a>
        <a
          href="#"
          onClick={() => history.go(-1)}
          className="hover:text-blue-400 transition-colors"
        >
          Go Back
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gray-800">
        <SpatialDiv
          spatialStyle={{
            position: { z: 50 }, // Bulge 50 in the z direction
          }}
          className="text-6xl font-bold text-white p-8 bg-blue-500 rounded-xl"
        >
          Floating on the Z-axis -- 50
        </SpatialDiv>
      </div>
    </div>
  )
}

// Create the root element and render
const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

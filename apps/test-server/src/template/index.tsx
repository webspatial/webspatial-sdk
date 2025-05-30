import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Model, SpatialDiv } from '@webspatial/react-sdk'

function App() {
  const [toggle, setToggle] = useState(true)

  return (
    <div
      style={{
        '--xr-back': 50,
        '--xr-background-material': 'transparent',
        backgroundColor: 'transparent',
      }}
      enable-xr
    >
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

import { SpatialHelper } from '@webspatial/core-sdk'
import React from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  return (
    <div className="h-full w-full p-4">
      <div className="h-full w-full flex gap-4">
        {/* Left side - contains two panels stacked vertically */}
        <div className="w-1/2 h-full flex flex-col gap-4">
          {/* Top left panel */}
          <div className="h-1/2 bg-gray-800 p-4 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://cdn.pixabay.com/photo/2022/12/29/17/10/sunset-7685372_960_720.jpg')] bg-cover bg-center opacity-40"></div>
            <div className="relative z-10 text-white">Top Left Panel</div>
          </div>
          {/* Bottom left panel */}
          <div className="h-1/2 bg-gray-800 p-4 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://cdn.pixabay.com/photo/2024/03/21/15/42/anime-8648011_960_720.jpg')] bg-cover bg-center opacity-40"></div>
            <div className="relative z-10 text-white">Bottom Left Panel</div>
          </div>
        </div>

        {/* Right side panel - takes full height */}
        <div className="w-1/2 h-full bg-gray-800 p-4 rounded-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://cdn.pixabay.com/photo/2024/05/09/08/07/ai-generated-8750175_960_720.jpg')] bg-cover bg-center opacity-40"></div>
          <div className="relative z-10 text-white">Right Panel</div>
        </div>
      </div>
    </div>
  )
}

SpatialHelper.instance?.setBackgroundStyle(
  { material: { type: 'translucent' }, cornerRadius: 15 },
  '#00000000',
)

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

import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Model } from '@webspatial/react-sdk'

function App() {
  let [_supported, setSupported] = useState(false)
  var header = useRef<HTMLDivElement>(null)

  return (
    <div className={`min-h-screen text-white`}>
      {/* Navigation */}
      <nav className="fixed w-full bg-[#111111] z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <span className="text-xl font-bold">WebSpatial</span>
            <a
              href="https://github.com/webspatial/webspatial-sdk"
              className="text-gray-300 hover:text-white"
            >
              Github
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          <div ref={header}>
            <div className="bg-[#222222] inline-block px-4 py-1 rounded-full mb-8">
              <span className="text-sm">
                ✨ WebSpatial 1.1.0 is available now! ✨
              </span>
            </div>
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-300 to-blue-500 text-transparent bg-clip-text">
              Ship XR apps with WebSpatial
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Build cross-platform XR apps with JavaScript, React, HTML, and CSS
            </p>
          </div>

          <div className="mt-16 rounded-xl overflow-hidden bg-[#1A1A1A] border border-gray-800 shadow-2xl max-w-4xl mx-auto">
            {/* Window Header */}
            <div className="bg-[#222222] px-4 py-3 flex items-center">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#28C840]"></div>
              </div>
              <div className="mx-auto text-gray-400 text-sm">Example.jsx</div>
            </div>

            {/* Window Content */}
            <div className="p-6 text-left">
              <pre className="text-sm text-gray-300">
                <code>{`import { Model } from '@webspatial/react-sdk'

function App() {
  return (
      <div
        enable-xr
        style={{color: "blue", "--xr-back": 50}}>
          <h1>3D UI on XR devices and embeded 3D models</h1>
      </div>
      
      <Model enable-xr  src="/assets/3DFile.usdz" />
  )
}`}</code>
              </pre>
            </div>
          </div>
          <div className="mt-16 rounded-xl overflow-hidden bg-[#1A1A1A] border border-gray-800 shadow-2xl max-w-4xl mx-auto">
            <div className="p-6 flex flex-col items-center space-y-8">
              <div enable-xr style={{ color: 'blue-400', '--xr-back': 50 }}>
                <h1 className="text-xl font-medium">
                  3D UI on XR devices and embeded 3D models
                </h1>
              </div>

              <div className="w-64 h-64 bg-[#2A2A2A] rounded-lg p-4 flex items-center justify-center">
                <Model
                  enable-xr
                  src="https://raw.githubusercontent.com/webspatial/test-assets/main/kenney/arcade-machine-color.usdz"
                  style={{ width: '200px', height: '200px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

document.addEventListener('readystatechange', event => {
  switch (document.readyState) {
    case 'interactive':
      // Initialize react
      var root = document.createElement('div')
      document.body.appendChild(root)
      ReactDOM.createRoot(root).render(<App />)

      // Force page height to 100% to get centering to work
      document.documentElement.style.height = '100%'
      document.body.style.height = '100%'
      root.style.height = '100%'

      break
  }
})

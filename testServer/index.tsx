import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Model, SpatialDiv } from '@webspatial/react-sdk'
import { Spatial } from '@webspatial/core-sdk'

function App() {
  let [supported, setSupported] = useState(false)
  useEffect(() => {
    setSupported(new Spatial().isSupported())
  }, [])

  return (
    <div
      className={`min-h-screen ${supported ? 'bg-[#11111177]' : 'bg-[#111111]'} text-white`}
    >
      {/* Navigation */}
      <nav className="fixed w-full bg-[#111111] z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <span className="text-xl font-bold">WebSpatial</span>
            <a
              href="/src/docsWebsite/index.html"
              className="text-gray-300 hover:text-white"
            >
              Docs
            </a>
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
          <div className="bg-[#222222] inline-block px-4 py-1 rounded-full mb-8">
            <span className="text-sm">
              ✨ WebSpatial Alpha is available now! ✨
            </span>
          </div>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-300 to-blue-500 text-transparent bg-clip-text">
            Ship XR apps with WebSpatial
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Build cross-platform XR apps with JavaScript, React, HTML, and CSS
          </p>
          <a href="/src/docsWebsite/index.html?docFile=helloWorld.md">
            <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-3 px-8 rounded-full hover:opacity-90 transition duration-300">
              Get Started
            </button>
          </a>

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
                <code>{`import { Model, SpatialDiv } from '@webspatial/react-sdk'

function App() {
  return (
      <SpatialDiv 
        spatialStyle={{ position: { z: 50 } }} 
        style={{color: "blue"}}>
          <h1>3D UI on XR devices and embeded 3D models</h1>
      </SpatialDiv>
      
      <Model>
        <source
          src="/assets/3DFile.usdz"
          type="model/vnd.usdz+zip" />
        <source
          src="/assets/3DFile.glb"
          type="model/gltf-binary" />
      </Model>
  )
}`}</code>
              </pre>
            </div>
          </div>
          <div className="mt-16 rounded-xl overflow-hidden bg-[#1A1A1A] border border-gray-800 shadow-2xl max-w-4xl mx-auto">
            <div className="p-6 flex flex-col items-center space-y-8">
              <SpatialDiv
                spatialStyle={{ position: { z: 50 } }}
                style={{ color: 'blue-400' }}
              >
                <h1 className="text-xl font-medium">
                  3D UI on XR devices and embeded 3D models
                </h1>
              </SpatialDiv>

              <div className="w-64 h-64 bg-[#2A2A2A] rounded-lg p-4 flex items-center justify-center">
                <Model style={{ width: '200px', height: '200px' }}>
                  <source
                    src="https://raw.githubusercontent.com/immersive-web/model-element/main/examples/assets/FlightHelmet.usdz"
                    type="model/vnd.usdz+zip"
                  />
                  <source
                    src="https://raw.githubusercontent.com/BabylonJS/MeshesLibrary/master/flightHelmet.glb"
                    type="model/gltf-binary"
                  />
                </Model>
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
      ReactDOM.createRoot(root).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
      )

      // Force page height to 100% to get centering to work
      document.documentElement.style.height = '100%'
      document.body.style.height = '100%'
      root.style.height = '100%'

      break
  }
})

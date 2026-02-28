import React, { useEffect, useRef } from 'react'
import { Model } from '@webspatial/react-sdk'

export default function Home() {
  const header = useRef<HTMLDivElement>(null)
  useEffect(() => {
    document.documentElement.style.setProperty('--spa-bg-color', 'transparent')
    return () => {
      document.documentElement.style.removeProperty('--spa-bg-color')
    }
  }, [])

  return (
    <div className="container mx-auto px-4 pt-16 pb-20">
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
  )
}

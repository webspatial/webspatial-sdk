import React from 'react'
import ReactDOM from 'react-dom/client'
import { Spatial } from '@webspatial/core-sdk'

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
    <div className="p-8">
      <div className="flex text-white text-lg bg-black bg-opacity-25 p-8 gap-5 mb-8">
        <a href="/" className="hover:text-blue-400">
          Return to Home Page
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a
          href="/src/qaTestApp/index.html"
          className="p-6 bg-blue-500 bg-opacity-25 rounded-xl text-white hover:bg-opacity-40 transition-all"
        >
          <h2 className="text-xl font-bold mb-2">3D Text Test</h2>
          <p className="text-sm opacity-80">
            Test the rendering effect of spatial text
          </p>
        </a>

        <a
          href="/src/qaTestApp/domapi.html"
          className="p-6 bg-blue-500 bg-opacity-25 rounded-xl text-white hover:bg-opacity-40 transition-all"
        >
          <h2 className="text-xl font-bold mb-2">DOM API Test</h2>
          <p className="text-sm opacity-80">
            Test DOM style and class operations
          </p>
        </a>
        <a
          href="/src/qaTestApp/materialApiTest/materialapi.html"
          className="p-6 bg-blue-500 bg-opacity-25 rounded-xl text-white hover:bg-opacity-40 transition-all"
        >
          <h2 className="text-xl font-bold mb-2">Material API Test</h2>
          <p className="text-sm opacity-80">Tests for Material APIs</p>
        </a>

        <a
          href="/src/qaTestApp/domapiTest/domapi1.html"
          className="p-6 bg-blue-500 bg-opacity-25 rounded-xl text-white hover:bg-opacity-40 transition-all"
        >
          <h2 className="text-xl font-bold mb-2">DOM API Test</h2>
          <p className="text-sm opacity-80">
            Test DOM style and class operations
          </p>
        </a>

        <a
          href="/src/qaTestApp/depthPositionTest/index.html"
          className="p-6 bg-blue-500 bg-opacity-25 rounded-xl text-white hover:bg-opacity-40 transition-all"
        >
          <h2 className="text-xl font-bold mb-2">Depth Position</h2>
          <p className="text-sm opacity-80">Test SpatialDiv depth position</p>
        </a>

        <a
          href="/src/qaTestApp/CssAPITest/cssapi.html"
          className="p-6 bg-blue-500 bg-opacity-25 rounded-xl text-white hover:bg-opacity-40 transition-all"
        >
          <h2 className="text-xl font-bold mb-2">CSS API Test</h2>
          <p className="text-sm opacity-80">Test CSS API</p>
        </a>

        <a
          href="/src/qaTestApp/SceneTest/index.html"
          className="p-6 bg-blue-500 bg-opacity-25 rounded-xl text-white hover:bg-opacity-40 transition-all"
        >
          <h2 className="text-xl font-bold mb-2">Scene Test</h2>
          <p className="text-sm opacity-80">Test spatial layout JS API</p>
        </a>
        <a
          href="/src/qaTestApp/transformTest/transformTest.html"
          className="p-6 bg-blue-500 bg-opacity-25 rounded-xl text-white hover:bg-opacity-40 transition-all"
        >
          <h2 className="text-xl font-bold mb-2">Transform Test</h2>
          <p className="text-sm opacity-80">Transform API Tests</p>
        </a>
        <a
          href="/src/qaTestApp/jsAnimationTest/jsAnimationTest.html"
          className="p-6 bg-blue-500 bg-opacity-25 rounded-xl text-white hover:bg-opacity-40 transition-all"
        >
          <h2 className="text-xl font-bold mb-2">Animation Test</h2>
          <p className="text-sm opacity-80">3rd party JS Animation Tests</p>
        </a>
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

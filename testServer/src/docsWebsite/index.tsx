import React, { useEffect, useState, useRef, ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import { Spatial, SpatialEntity, SpatialSession } from '@xrsdk/runtime'
import { SpatialIFrame, Model } from '@xrsdk/react'

function App2() {
  return <div></div>
}

var spatial: Spatial | null = new Spatial()
if (!spatial.isSupported()) {
  spatial = null
}

// Create session if spatial is supported
var session: SpatialSession | null = null
if (spatial) {
  session = spatial.requestSession()
}
if (session) {
  var translucentStyle = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue('--spatial-material')
  if (translucentStyle == 'translucent') {
    session
      .getCurrentWindowComponent()
      .setStyle({ material: { type: 'default' }, cornerRadius: 0 })
  }

  var backgroundStyle = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue('--spatial-background-color')
  if (backgroundStyle) {
    document.documentElement.style.backgroundColor = backgroundStyle
  }
}

function MySample() {
  var [toggle, setToggle] = useState(true)
  useEffect(() => {
    if (session) {
      session
        .getCurrentWindowComponent()
        .setStyle({ material: { type: toggle ? 'default' : 'none' } })
    }
  }, [toggle])
  return (
    <div>
      <div
        className="btn"
        onClick={() => {
          setToggle(!toggle)
        }}
      >
        Toggle Background Material
      </div>
    </div>
  )
}

function App(props: { children?: ReactNode }) {
  var [spatialSupported, setSpatialSupported] = useState(false)
  useEffect(() => {
    if (session) {
      setSpatialSupported(true)
    }
  }, [])

  return (
    <div className="flex">
      <div className="drawer lg:drawer-open flex-1">
        <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content">
          <div className=" lg:hidden">
            <label
              htmlFor="my-drawer-2"
              className="btn drawer-button lg:hidden "
            >
              Show menu
            </label>
          </div>

          <div className="w-full h-full">
            <div className="w-full">Show code</div>
            {props.children}
          </div>
        </div>
        <div className="drawer-side">
          <label
            htmlFor="my-drawer-2"
            aria-label="close sidebar"
            className="drawer-overlay"
          ></label>
          <ul
            className="menu bg-base-200 text-base-content min-h-full w-80 p-4"
            style={{ backgroundColor: '#00000088' }}
          >
            <h1 className="text-3xl">WebSpatial</h1>
            <li>
              <details open>
                <summary style={{ cursor: 'pointer' }}>Docs</summary>
                <ul>
                  <li>
                    <a>Getting started</a>
                  </li>
                  <li>
                    <a>Hello world</a>
                  </li>
                </ul>
              </details>
            </li>
            <li>
              <details open>
                <summary style={{ cursor: 'pointer' }}>Examples</summary>
                <ul>
                  <li>
                    <details open>
                      <summary style={{ cursor: 'pointer' }}>JS API</summary>
                      <ul>
                        <li>
                          <a>3D Web Element</a>
                        </li>
                        <li>
                          <a>Load model</a>
                        </li>
                      </ul>
                    </details>
                  </li>
                  <li>
                    <details open>
                      <summary style={{ cursor: 'pointer' }}>React API</summary>
                      <ul>
                        <li>
                          <a>Submenu 1</a>
                        </li>
                        <li>
                          <a>Submenu 2</a>
                        </li>
                      </ul>
                    </details>
                  </li>
                </ul>
              </details>
            </li>
            <li>
              <details open>
                <summary style={{ cursor: 'pointer' }}>Code</summary>
                <ul>
                  <li>
                    <a>Github</a>
                  </li>
                  <li>
                    <a>NPM</a>
                  </li>
                </ul>
              </details>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

document.addEventListener('readystatechange', event => {
  switch (document.readyState) {
    case 'interactive':
      // Create react root
      var root = document.createElement('div')
      document.body.appendChild(root)
      ReactDOM.createRoot(root).render(
        <App>
          <MySample />
        </App>,
      )
      break
  }
})

import React, { useEffect, useState, useRef, ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import { Spatial, SpatialEntity, SpatialSession } from '@xrsdk/runtime'
import { SpatialIFrame, Model } from '@xrsdk/react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark as dark } from 'react-syntax-highlighter/dist/esm/styles/prism'

export function showSample(MySample: Function, hasCode = true) {
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
        .setStyle({
          transparentEffect: true,
          glassEffect: true,
          cornerRadius: 0,
        })
    }

    var backgroundStyle = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue('--spatial-background-color')
    if (backgroundStyle) {
      document.documentElement.style.backgroundColor = backgroundStyle
    }
  }

  function App(props: { children?: ReactNode }) {
    var [spatialSupported, setSpatialSupported] = useState(false)
    var [showCode, setShowCode] = useState('')

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
              <div>
                <label
                  htmlFor="my-drawer-2"
                  className="btn drawer-button lg:hidden "
                >
                  Show menu
                </label>
              </div>
            </div>
            <div className="w-full h-full">
              {hasCode ? (
                <div
                  className="btn m-5"
                  onClick={() => {
                    if (showCode == '') {
                      const urlParams = new URLSearchParams(
                        window.location.search,
                      )
                      const examplePath = urlParams.get('examplePath')
                      fetch('/src/docsWebsite/examples/' + examplePath + '.tsx')
                        .then(response => response.text())
                        .then(text => setShowCode(text))
                    } else {
                      setShowCode('')
                    }
                  }}
                >
                  Toggle Show code
                </div>
              ) : (
                <></>
              )}

              {showCode == '' ? (
                <></>
              ) : (
                <SyntaxHighlighter language="typescript" style={dark}>
                  {showCode}
                </SyntaxHighlighter>
              )}

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
              <a href="/src/docsWebsite/index.html">
                <h1 className="text-3xl">WebSpatial</h1>
              </a>
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
                            <a>Create Session</a>
                          </li>
                          <li>
                            <a href="/src/docsWebsite/index.html?examplePath=backgroundMaterial">
                              BackgroundMaterial
                            </a>
                          </li>
                          <li>
                            <a>3D Web Element</a>
                          </li>
                          <li>
                            <a>Load model</a>
                          </li>
                          <li>
                            <a>Open Window Group</a>
                          </li>
                          <li>
                            <a>Game loop</a>
                          </li>
                        </ul>
                      </details>
                    </li>
                    <li>
                      <details open>
                        <summary style={{ cursor: 'pointer' }}>
                          React API
                        </summary>
                        <ul>
                          <li>
                            <a>Spatial Dom Element</a>
                          </li>
                          <li>
                            <a>Model Element</a>
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

  var root = document.createElement('div')
  document.addEventListener('readystatechange', event => {
    switch (document.readyState) {
      case 'complete':
        document.body.appendChild(root)
        var createdRoot = ReactDOM.createRoot(root)
        // Create react root
        createdRoot.render(
          <App>
            <MySample session={session} />
          </App>,
        )
        break
    }
  })
}

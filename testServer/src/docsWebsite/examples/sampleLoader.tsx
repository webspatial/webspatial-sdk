import React, { useEffect, useState, useRef, ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import { flushSync } from 'react-dom'
import { Spatial, SpatialSession } from '@xrsdk/runtime'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark as dark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'

export function showSample(MySample: any, hasCode = true) {
  var spatial: Spatial | null = new Spatial()
  if (!spatial.isSupported()) {
    spatial = null
  }

  // Create session if spatial is supported
  var session: SpatialSession | null = null
  if (spatial) {
    session = spatial.requestSession()
  }

  function App(props: { children?: ReactNode }) {
    var [spatialSupported, setSpatialSupported] = useState(false)
    var [showCode, setShowCode] = useState('')
    var [showMarkdown, setShowMarkdown] = useState('')

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
              {spatialSupported ? (
                <></>
              ) : (
                <div className="w-full bg-slate-500">
                  Note: WebSpatial is not supported in this browser so xr
                  content will not be displayed. Currently only availible on
                  Apple Vision Pro app
                </div>
              )}
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
                        .then(text => {
                          const regex =
                            /CODESAMPLE_START.(.*?)\/\/ CODESAMPLE_END/s
                          const matches = text.match(regex)
                          if (matches && matches[1]) {
                            setShowCode(matches[1])
                          } else {
                            setShowCode(text)
                          }
                        })
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
              <a href="/">
                <h1 className="text-3xl">WebSpatial</h1>
              </a>
              <li>
                <details open>
                  <summary style={{ cursor: 'pointer' }}>Docs</summary>
                  <ul>
                    <li>
                      <a href="/src/docsWebsite/index.html">Getting started</a>
                    </li>
                    <li>
                      <a href="/src/docsWebsite/index.html?examplePath=helloWorld">
                        Hello world
                      </a>
                    </li>
                  </ul>
                </details>
              </li>
              <li>
                <details open>
                  <summary style={{ cursor: 'pointer' }}>Samples</summary>
                  <ul>
                    <li>
                      <details open>
                        <summary style={{ cursor: 'pointer' }}>JS API</summary>
                        <ul>
                          <li>
                            <a href="/src/docsWebsite/index.html?examplePath=createSession">
                              Create Session
                            </a>
                          </li>
                          <li>
                            <a href="/src/docsWebsite/index.html?examplePath=backgroundMaterial">
                              BackgroundMaterial
                            </a>
                          </li>
                          <li>
                            <a href="/src/docsWebsite/index.html?examplePath=webElement">
                              3D Web Element
                            </a>
                          </li>
                          <li>
                            <a href="/src/docsWebsite/index.html?examplePath=spatialView">
                              Spatial View
                            </a>
                          </li>
                          <li>
                            <a href="/src/docsWebsite/index.html?examplePath=loadModel">
                              Load model file
                            </a>
                          </li>
                          <li>
                            <a href="/src/docsWebsite/index.html?examplePath=openWindowGroup">
                              Open Window Group
                            </a>
                          </li>
                          <li>
                            <a href="/src/docsWebsite/index.html?examplePath=gameLoop">
                              Game loop
                            </a>
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
                            <a href="/src/docsWebsite/index.html?examplePath=reactDomElement">
                              Spatial Dom Elements
                            </a>
                          </li>
                          <li>
                            <a href="/src/docsWebsite/index.html?examplePath=reactModelElement">
                              3D Model Element
                            </a>
                          </li>
                          <li>
                            <a href="/src/docsWebsite/index.html?examplePath=reactPopup">
                              Popup Element
                            </a>
                          </li>
                        </ul>
                      </details>
                    </li>
                  </ul>
                </details>
              </li>
              <li>
                <details open>
                  <summary style={{ cursor: 'pointer' }}>Showcases</summary>
                  <ul>
                    <li>
                      <a>Ecommerce Website</a>
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

        // There seems to be a bug with React's concurrent renderer in safari which is causing an FOUC
        // This is required to force dom updates prior to page completion
        flushSync(() => {
          // Create react root
          createdRoot.render(
            <App>
              <MySample session={session} />
            </App>,
          )
        })
        break
    }
  })
}

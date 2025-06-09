import { useEffect, useState, ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import { flushSync } from 'react-dom'
import { Spatial, SpatialSession } from '@webspatial/core-sdk'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark as dark } from 'react-syntax-highlighter/dist/esm/styles/prism'

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
              <div className="p-5">{props.children}</div>
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
                  <summary style={{ cursor: 'pointer' }}>
                    Getting started
                  </summary>
                  <ul>
                    <li>
                      <a href="/src/docsWebsite?docFile=whatIsWebSpatial.md">
                        What is WebSpatial?
                      </a>
                    </li>
                    <li>
                      <a href="/src/docsWebsite?docFile=helloWorld.md">
                        Quick Example (Hello world)
                      </a>
                    </li>
                    <li>
                      <a href="/src/docsWebsite?docFile=projectSetup.md">
                        Project Setup
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
                            <a href="/src/docsWebsite?examplePath=createSession">
                              Create Session
                            </a>
                          </li>
                          <li>
                            <a href="/src/docsWebsite?examplePath=backgroundMaterial">
                              BackgroundMaterial
                            </a>
                          </li>
                          <li>
                            <a href="/src/docsWebsite?examplePath=webElement">
                              3D Web Element
                            </a>
                          </li>
                          <li>
                            <a href="/src/docsWebsite?examplePath=spatialView">
                              Spatial View
                            </a>
                          </li>
                          <li>
                            <a href="/src/docsWebsite?examplePath=loadModel">
                              Load model file
                            </a>
                          </li>
                          <li>
                            <a href="/src/docsWebsite?examplePath=openWindowContainer">
                              Open Window Container
                            </a>
                          </li>
                          <li>
                            <a href="/src/docsWebsite?examplePath=gameLoop">
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
                            <a href="/src/docsWebsite?examplePath=reactDomElement">
                              Spatial Dom Elements
                            </a>
                          </li>
                          <li>
                            <a href="/src/docsWebsite?examplePath=reactModelElement">
                              3D Model Element
                            </a>
                          </li>
                          <li>
                            <a href="/src/docsWebsite?examplePath=reactSpatialViewElement">
                              Spatial View Element (3D Volume)
                            </a>
                          </li>
                          <li>
                            <a href="/src/docsWebsite?examplePath=reactPopup">
                              Popup Element
                            </a>
                          </li>
                          <li>
                            <a href="/src/docsWebsite?examplePath=particleEffect">
                              Particle Effect
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
                  <summary style={{ cursor: 'pointer' }}>Learn</summary>
                  <ul>
                    <li>
                      <a href="/src/docsWebsite?docFile=debuggingGuide.md">
                        Debugging Guide
                      </a>
                    </li>
                    <li>
                      <a href="/src/docsWebsite?docFile=modelFileSupport.md">
                        Model File Support
                      </a>
                    </li>
                    <li>
                      <a href="/src/docsWebsite?docFile=publishOnAppStore.md">
                        Publish on app store
                      </a>
                    </li>
                    <li>
                      <a href="/src/docsWebsite?docFile=architecture.md">
                        Architecture
                      </a>
                    </li>
                  </ul>
                </details>
              </li>
              <li>
                <details open>
                  <summary style={{ cursor: 'pointer' }}>API Reference</summary>
                  <ul>
                    <li>
                      <a href="https://github.com/webspatial/webspatial.github.io/blob/main/docs/globals.md">
                        Generated Docs
                      </a>
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
  document.addEventListener('readystatechange', _event => {
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

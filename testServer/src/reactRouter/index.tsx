import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import { PortalTest } from './tests/portal'
import { NestedDivsTest } from './tests/nestedDivs'
import { ToolbarTest } from './tests/toolbar'
import { PopupTest } from './tests/popup'
import { ManyPanelTest } from './tests/manyPanels'
import { SpatialDiv } from '@xrsdk/react'

function HomePage() {
  return <>This is the homepage with nothing</>
}

var testPages = [
  HomePage,
  PortalTest,
  NestedDivsTest,
  ToolbarTest,
  PopupTest,
  ManyPanelTest,
]

// Create react root
var root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <HashRouter>
      <div className="navbar bg-base-100">
        <div className="flex-1">
          <Link to="/">
            <div className="btn btn-ghost text-xl">Routes</div>
          </Link>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            <li>
              <a href="/src/jsApiTestPages/testList.html">FullTestList</a>
            </li>
            {testPages.map((page, i) => {
              return (
                <li key={i}>
                  <Link to={'/' + page.name}>
                    <div>{page.name}</div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
      <Routes>
        <Route
          path={'/'}
          element={
            <SpatialDiv>
              <div
                style={{
                  width: '500px',
                  height: '500px',
                  backgroundColor: 'red',
                }}
              >
                Hello world!!!
              </div>
            </SpatialDiv>
          }
        ></Route>
        {testPages.map((page, i) => {
          var MyTag = page
          return (
            <Route key={i} path={'/' + page.name} element={<MyTag />}></Route>
          )
        })}
      </Routes>
    </HashRouter>
  </React.StrictMode>,
)

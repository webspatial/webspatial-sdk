import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import { PortalTest } from './tests/portal'
import { NestedDivsTest } from './tests/nestedDivs'
import { ToolbarTest } from './tests/toolbar'

function HomePage() {
    return <>
        This is the homepage with nothing
    </>
}

var testPages = [
    HomePage,
    PortalTest,
    NestedDivsTest,
    ToolbarTest,
]


// Create react root
var root = document.createElement("div")
document.body.appendChild(root)
ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <HashRouter>
            <div className="navbar bg-base-100">
                <div className="flex-1">
                    <Link to="/"><div className="btn btn-ghost text-xl">Routes</div></Link>
                </div>
                <div className="flex-none">
                    <ul className="menu menu-horizontal px-1">
                        <li><a href="/src/jsApiTestPages/testList.html">FullTestList</a></li>
                        {testPages.map((page, i) => {
                            return (
                                <li key={i}><Link to={"/" + page.name}><div>{page.name}</div></Link></li>
                            );
                        })}
                    </ul>
                </div>
            </div>
            <Routes>
                <Route path={"/"} element={<div />}></Route>
                {testPages.map((page, i) => {
                    var MyTag = page
                    return (
                        <Route key={i} path={"/" + page.name} element={<MyTag />}></Route>
                    );
                })}
            </Routes>
        </HashRouter>
    </React.StrictMode>
)
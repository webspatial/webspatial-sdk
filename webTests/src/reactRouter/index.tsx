import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'

function PortalTest() {
    return <>
        <div>
            To be implemented
        </div>
    </>
}

function HomePage() {
    return <>
        This is the homepage with nothing
    </>
}

// Create react root
var root = document.createElement("div")
document.body.appendChild(root)
ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <HashRouter>
            <div className="navbar bg-base-100">
                <div className="flex-1">
                    <Link to="/"><a className="btn btn-ghost text-xl">Routes</a></Link>
                </div>
                <div className="flex-none">
                    <ul className="menu menu-horizontal px-1">
                        <li><a href="/src/jsApiTestPages/testList.html">FullTestList</a></li>
                        <li><Link to="/portalTest"><a>Portal</a></Link></li>
                    </ul>
                </div>
            </div>
            <Routes>
                <Route path="/" element={<HomePage />}></Route>
                <Route path="/portalTest" element={<PortalTest />}></Route>
            </Routes>
        </HashRouter>
    </React.StrictMode>
)
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import { PortalIFrame } from 'web-spatial/src/webSpatialComponents'



function PortalTest() {
    return <>
        <div>
            To be implemented
        </div>
        <div>
            <PortalIFrame>
                <div onClick={() => { document.body.style.backgroundColor = 'red' }}>
                    This text is inside a portal iframe
                </div>
            </PortalIFrame>
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
                    <Link to="/"><div className="btn btn-ghost text-xl">Routes</div></Link>
                </div>
                <div className="flex-none">
                    <ul className="menu menu-horizontal px-1">
                        <li><a href="/src/jsApiTestPages/testList.html">FullTestList</a></li>
                        <li><Link to="/portalTest"><div>Portal</div></Link></li>
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
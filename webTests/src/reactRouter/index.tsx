import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import { SpatialDiv } from 'web-spatial/src/webSpatialComponents'



function PortalTest() {
    return <>
        <div>
            To be implemented
        </div>
        <div>
            <SpatialDiv spatialStyle={{ position: { z: 100, x: 0, y: 0 } }} style={{ position: "absolute", top: "45%", left: "45%", width: "10%", height: "10%", backgroundColor: "white" }}>
                <p>This is a popup</p>
            </SpatialDiv>
            <div style={{ color: "red" }}>
                <SpatialDiv spatialStyle={{ position: { z: 20, x: 0, y: 0 } }}>
                    <p>This text should be red</p>
                </SpatialDiv>
            </div>
            <SpatialDiv className='p-10' spatialStyle={{ position: { z: 50, x: 100, y: 50 } }} style={{ backgroundColor: "gray", width: "50%" }}>
                <div onClick={() => { document.body.style.backgroundColor = 'gray' }}>
                    <p>This text is inside a portal iframe</p>
                    <a href="/">click me</a>
                </div>
            </SpatialDiv>
            <div className='p-10' style={{ backgroundColor: "gray", width: "50%" }}>
                <div onClick={() => { document.body.style.backgroundColor = 'gray' }}>
                    <p>This text is inside a div notiframe</p>
                </div>
            </div>
            <div className='p-10' >
                <div onClick={() => { document.body.style.backgroundColor = 'gray' }}>
                    <p>This text is inside a div notiframe</p>
                </div>
            </div>
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
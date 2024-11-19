import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Model, SpatialDiv } from 'web-spatial'

function App() {
    const [toggle, setToggle] = useState(true)

    return (<div className='w-screen h-screen flex justify-center items-center'>
        <SpatialDiv spatialStyle={{ position: { z: 50 }, glassEffect: true, cornerRadius: 10 }} style={{ height: "300px" }} className='p-20 flex justify-center items-center'>
            <p>Hello world!</p>
        </SpatialDiv>
        <SpatialDiv spatialStyle={{ position: { z: 30 }, glassEffect: true, cornerRadius: 10 }} className={'p-10' + (toggle ? "" : " bg-slate-400")}>
            <button onClick={() => {
                console.log("test")
                setToggle(!toggle)
            }}>Click on this</button>
        </SpatialDiv>
        <div style={{ height: "100px", width: "100px" }}>
            <Model className="w-full h-full bg-white bg-opacity-25 rounded-xl">
                <source src="/src/assets/FlightHelmet.usdz" type="model/vnd.usdz+zip" ></source>
            </Model>
        </div>
    </div>)
}

// Initialize react
var root = document.createElement("div")
document.body.appendChild(root)
ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
// Force page height to 100% to get centering to work
document.documentElement.style.height = "100%"
document.body.style.height = "100%"
root.style.height = "100%"
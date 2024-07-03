import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Spatial, SpatialEntity, SpatialIFrameComponent, SpatialModelComponent, SpatialModelUIComponent, SpatialSession } from 'web-spatial/src/index';
import { Model, SpatialIFrame } from 'web-spatial/src/webSpatialComponents';
// Import tailwind CSS (tailwind.config.js also required)
import '/src/index.css'

var spatial: Spatial | null = new Spatial();
if (spatial.isSupported()) {
    (window.navigator as any).spatial = spatial;
} else {
    spatial = null
}

// Create session if spatial is supported
if (spatial) {
    var session = await spatial.requestSession()
    // Set default style 
    await (await session.getCurrentIFrameComponent()).setStyle({ transparentEffect: true, glassEffect: true, cornerRadius: 70, windowGroupDimensions: { x: 1280, y: 720 } })
}

const useAnimationFrame = (callback: any) => {
    // Use useRef for mutable variables that we want to persist
    // without triggering a re-render on their change
    const requestRef = React.useRef(null as any);
    const previousTimeRef = React.useRef(null as any);

    const animate = (time: number) => {
        if (previousTimeRef.current != undefined) {
            const deltaTime = time - previousTimeRef.current;
            callback(deltaTime)
        }
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    }

    React.useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, []); // Make sure the effect runs only once
}

function App() {
    const [hours, setHours] = React.useState(0)
    const [minutes, setMinutes] = React.useState(0)
    const [seconds, setSeconds] = React.useState(0)

    React.useEffect(() => {
        //   session.log("got storage update")
        window.addEventListener("storage", function () {
            session.log("got storage update")
        }, false);

        setTimeout(() => {
            window.localStorage.setItem("config", JSON.stringify({ a: 5 }))
            // session.log("app set config")
            // session.log("readback " + window.localStorage.getItem("config"))
            //  window.dispatchEvent(new Event('storage'))
        }, 100);

        (async () => {
            await (await session.getCurrentIFrameComponent()).setStyle({ transparentEffect: true, glassEffect: true, cornerRadius: 70, windowGroupDimensions: { x: 880, y: 200 } })
        })()
    }, []);

    useAnimationFrame((deltaTime: number) => {
        // Pass on a function to the setter of the state
        // to make sure we always have the latest state
        //setCount(prevCount => (prevCount + deltaTime * 0.01) % 100)

        const today = new Date();
        let h = today.getHours();
        let m = today.getMinutes();
        let s = today.getSeconds();
        setHours(h)
        setMinutes(m)
        setSeconds(s)
    })

    document.documentElement.style.backgroundColor = "#1155aa55";
    return (
        <div className='w-full text-white text-center font-mono select-none'>
            <span className=' text-sm'>{hours > 12 ? "PM" : "AM"}</span><span className='text-9xl'>{hours % 12}:{minutes < 10 ? "0" + minutes : minutes}:{seconds < 10 ? "0" + seconds : seconds}</span>
            <h1 className='w-full flex flex-row-reverse'>
                {/* <a href="#" className='w-1/3 text-md py-5'>⏲️</a>
                <a href="#" className='w-1/3 text-md py-5'>🕗</a> */}
                <a href="#" onClick={async () => {
                    var wg = await session.createWindowGroup("Plain")

                    var ent = await session.createEntity()
                    ent.transform.position.x = 0
                    ent.transform.position.y = 0
                    ent.transform.position.z = 0
                    await ent.updateTransform()

                    var i = await session.createIFrameComponent(wg)
                    await i.setResolution(300, 300)
                    await i.loadURL("/src/clockApp/index.html?pageName=Settings")
                    await i.setAsRoot(true)
                    await i.setInline(true)
                    await ent.setComponent(i)

                    await ent.setParentWindowGroup(wg)

                }} className='w-1/3 text-md py-5'>⚙️</a>
            </h1>


        </div>
    )
}

function Settings() {
    document.documentElement.style.backgroundColor = "#1155aa55";
    return (
        <div className='w-full text-white text-center font-mono select-none'>
            <div className='text-3xl'>Settings</div>
        </div>
    )
}

// Components map
var names = {
    "App": App,
    "Settings": Settings,
} as { [x: string]: any }

var pageName = (new URLSearchParams(window.location.search)).get("pageName");
var MyTag = names[pageName ? pageName : "App"] as any;

// Create react root
var root = document.createElement("div")
document.body.appendChild(root)
ReactDOM.createRoot(root).render(
    <MyTag></MyTag>
)
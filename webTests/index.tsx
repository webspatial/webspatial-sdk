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
    await (await session.getCurrentIFrameComponent()).setStyle({ transparentEffect: true, glassEffect: false, cornerRadius: 0 })
}


function WebSpatialTitle(props: { makeShadow?: boolean }) {
    return <div className={props.makeShadow ? "absolute text-black" : "text-white"} style={props.makeShadow ? { zIndex: -1, filter: "blur(10px)", opacity: "50%" } : {}}>
        <h1 className='text-9xl'>WebSpatial</h1>
        <h3 className='text-2xl py-10'>Build cross-platform XR apps with JavaScript, HTML, and CSS</h3>
    </div>
}

function FeatureList() {
    return <div className='text-white'>
        <h3 className='text-2xl text-center mx-10'>Features</h3>
        <div className='grid grid-cols-2 gap-4 m-10 text-center'>
            <div className='p-10 bg-black bg-opacity-25'>
                <div className='text-5xl w-full'>🛰</div>
                Embed 3D models
            </div>
            <div className='p-10 bg-black bg-opacity-25'>
                <div className='text-5xl w-full'>🚀</div>
                Place IFrames in 3D space
            </div>
            <div className='p-10 bg-black bg-opacity-25'>
                <div className='text-5xl w-full'>🕹️</div>
                Get input from 3D elements
            </div>
            <div className='p-10 bg-black bg-opacity-25'>
                <div className='text-5xl w-full'>🍷</div>
                Glass Background Effect
            </div>
            <div className='p-10 bg-black bg-opacity-25'>
                <div className='text-5xl w-full'>🖼</div>
                Open spatial windows
            </div>
            <div className='p-10 bg-black bg-opacity-25'>
                <div className='text-5xl w-full'>⚛️</div>
                Compatable with ReactJS
            </div>
        </div>
    </div>
}

function App() {
    var [spatialSupported, setSpatialSupported] = useState(false)
    useEffect(() => {
        if (session) {
            setSpatialSupported(true);
            (async () => {
                await (await session.getCurrentIFrameComponent()).setStyle({ transparentEffect: true, glassEffect: true, cornerRadius: 50 })
                document.documentElement.style.backgroundColor = "#1155aa55";
            })();
        } else {
            document.body.style.backgroundColor = "#1155aa99"
        }
    }, [])

    return (
        <div>
            <div className='flex text-white text-lg bg-black bg-opacity-25 p-8 gap-5'>
                <a href="/" className='font-bold'>WebSpatial</a>
                <a href="/">Docs</a>
                <a href="/src/jsApiTestPages/testList.html">Examples</a>
                <a href="/">Github</a>
            </div>
            <div className='m-5 flex flex-row flex-wrap text-white'>
                <div className='grow flex flex-col  items-center justify-center p-20'>
                    {spatialSupported ?
                        <div>
                            <WebSpatialTitle makeShadow={true} />
                            <SpatialIFrame src="/index.html?pageName=WebSpatialTitle" className="" spatialOffset={{ z: 100 }}>
                                <WebSpatialTitle />
                            </SpatialIFrame>
                        </div>
                        :
                        <div>
                            <WebSpatialTitle />
                        </div>
                    }


                </div>

                <div className='grow bg-black bg-opacity-25 flex flex-col h-96  items-center justify-center p-20'>
                    {spatialSupported ?
                        <div className='w-full h-52'>
                            <Model className="w-full h-full bg-white bg-opacity-25 rounded-xl">
                                <source src="/src/assets/FlightHelmet.usdz" type="model/vnd.usdz+zip" ></source>
                            </Model>
                        </div>
                        :
                        <div className='w-full h-52'>
                            <div className="w-full h-full bg-white bg-opacity-25 rounded-xl">
                                Model goes here
                            </div>
                        </div>
                    }
                    <h3 className='text-xl'>Get Started</h3>
                    <h3 className='text-2xl'>npm i web-spatial</h3>
                </div>


                {spatialSupported ?
                    null
                    :
                    <div className='grow flex flex-col items-center justify-center p-20'>
                        <h3 className='text-2xl py-10'>This browser doesn't support WebSpatial.</h3>
                        <a href={
                            "webSpatial://" + window.location.href
                        } className='text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800'>Click Here to Open In Spatial Viewer app</a>
                    </div>
                }

                <div className='grow flex flex-col w-full bg-black bg-opacity-25 p-10 my-10'>
                    {spatialSupported ?
                        <div>
                            <SpatialIFrame src="/index.html?pageName=FeatureList" className="" spatialOffset={{ z: 100 }}>
                                <FeatureList />
                            </SpatialIFrame>
                        </div>
                        :
                        <FeatureList />
                    }
                </div>
            </div>
        </div>
    )
}

// Components mapp
var names = {
    "App": App,
    "WebSpatialTitle": WebSpatialTitle,
    "FeatureList": FeatureList
}

var pageName = (new URLSearchParams(window.location.search)).get("pageName");
console.log(pageName)
var MyTag = names[pageName ? pageName : "App"]

// Create react root
var root = document.createElement("div")
document.body.appendChild(root)
ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <MyTag></MyTag>
    </React.StrictMode >,
)
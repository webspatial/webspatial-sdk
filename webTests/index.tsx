import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Spatial, SpatialEntity, SpatialIFrameComponent, SpatialModelComponent, SpatialModelUIComponent, SpatialSession } from 'web-spatial/src/index';
import { Model, SpatialIFrame } from 'web-spatial/src/webSpatialComponents';


var spatial: Spatial | null = new Spatial();
if (!spatial.isSupported()) {
    spatial = null
}

// Create session if spatial is supported
if (spatial) {
    var session = spatial.requestSession()
}


function WebSpatialTitle(props: { makeShadow?: boolean }) {
    return <div className={props.makeShadow ? "absolute text-black" : "text-white bg-opacity-0"} style={props.makeShadow ? { zIndex: -1, filter: "blur(10px)", opacity: "50%" } : {}}>
        <h1 className='text-9xl'>WebSpatial</h1>
        <h3 className='text-2xl py-10'>Build cross-platform XR apps with JavaScript, HTML, and CSS</h3>
    </div>
}

function FeatureList() {
    return <div className='text-white text-sm sm:text-xl'>
        <h3 className='text-sm sm:text-2xl text-center mx-10'>Features</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 m-10 text-center'>
            <div className='p-10 bg-black bg-opacity-25'>
                <div className='text-sm sm:text-5xl w-full'>🛰</div>
                Embed 3D models
            </div>
            <div className='p-10 bg-black bg-opacity-25'>
                <div className='text-sm sm:text-5xl w-full'>🚀</div>
                Place IFrames in 3D space
            </div>
            <div className='p-10 bg-black bg-opacity-25'>
                <div className='text-sm sm:text-5xl w-full'>🕹️</div>
                Get input from 3D elements
            </div>
            <div className='p-10 bg-black bg-opacity-25'>
                <div className='text-sm sm:text-5xl w-full'>🍷</div>
                Glass Background Effect
            </div>
            <div className='p-10 bg-black bg-opacity-25'>
                <div className='text-sm sm:text-5xl w-full'>🖼</div>
                Open spatial windows
            </div>
            <div className='p-10 bg-black bg-opacity-25'>
                <div className='text-sm sm:text-5xl w-full'>⚛️</div>
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
                document.documentElement.style.backgroundColor = "#1155aa55";

                // Create entities
                var meshResource = await session.createMeshResource({ shape: "sphere" })
                var entities = new Array<{ e: SpatialEntity, v: { x: number, y: number, z: number } }>()
                for (var i = 0; i < 7; i++) {
                    let e = await session.createEntity()
                    e.transform.position = new DOMPoint(-0.35 + (i * 0.1), 0, 0.15)
                    e.transform.scale = new DOMPoint(0.04, 0.04, 0.04)
                    await e.updateTransform()
                    var mat = await session.createPhysicallyBasedMaterial()
                    mat.baseColor.r = 0.8
                    mat.baseColor.g = 0.8
                    mat.baseColor.b = 0.8 + (Math.random() * 0.2)
                    mat.metallic.value = 0.0
                    mat.roughness.value = 1.0
                    await mat.update()
                    var customModel = await session.createModelComponent()
                    customModel.setMaterials([mat])
                    customModel.setMesh(meshResource)
                    await e.setComponent(customModel)

                    // Handle input
                    let v = { x: (Math.random() - 0.5) * 0.01, y: (Math.random() - 0.5) * 0.01, z: (Math.random() - 0.5) * 0.01 }
                    var input = await session.createInputComponent()
                    await e.setComponent(input)
                    input.onTranslate = (data: any) => {
                        if (data.translate && data.translate.x) {
                            v.x = data.translate.x
                            v.y = data.translate.y
                            v.z = data.translate.z
                            e.updateTransform()
                        }
                    }

                    await e.setParentWindowGroup(await session.getCurrentWindowGroup())
                    entities.push({ e: e, v: v })
                }

                // Update loop for entities
                var dt = 0
                var curTime = Date.now()
                var loop = (time: DOMHighResTimeStamp) => {
                    session.requestAnimationFrame(loop)
                    dt = Date.now() - curTime
                    curTime = Date.now()
                    if (dt <= 0 || dt > 1000) {
                        return
                    }
                    for (var i = 0; i < entities.length; i++) {
                        var entity = entities[i].e
                        var timeMultiplier = (dt / (1000 / 90))
                        entity.transform.position.x += entities[i].v.x * timeMultiplier
                        entity.transform.position.y += entities[i].v.y * timeMultiplier
                        entity.transform.position.z += entities[i].v.z * timeMultiplier

                        entities[i].v.x *= 0.96 * Math.min(timeMultiplier, 1)
                        entities[i].v.y *= 0.96 * Math.min(timeMultiplier, 1)
                        entities[i].v.z *= 0.96 * Math.min(timeMultiplier, 1)

                        if (entity.transform.position.x < -0.5) {
                            entity.transform.position.x = -0.5
                            entities[i].v.x = Math.abs(entities[i].v.x)
                        }
                        if (entity.transform.position.x > 0.5) {
                            entity.transform.position.x = 0.5
                            entities[i].v.x = -Math.abs(entities[i].v.x)
                        }

                        if (entity.transform.position.y < -0.3) {
                            entity.transform.position.y = -0.3
                            entities[i].v.y = Math.abs(entities[i].v.y)
                        }
                        if (entity.transform.position.y > 0.3) {
                            entity.transform.position.y = 0.3
                            entities[i].v.y = -Math.abs(entities[i].v.y)
                        }

                        if (entity.transform.position.z < -0) {
                            entity.transform.position.z = -0
                            entities[i].v.z = Math.abs(entities[i].v.z)
                        }
                        if (entity.transform.position.z > 0.3) {
                            entity.transform.position.z = 0.3
                            entities[i].v.z = -Math.abs(entities[i].v.z)
                        }

                        entity.updateTransform()
                    }
                }
                session.requestAnimationFrame(loop)
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
                            <SpatialIFrame src="/index.html?pageName=WebSpatialTitle&transparent=true" className="" spatialOffset={{ z: 100 }}>
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
                            <SpatialIFrame src="/index.html?pageName=FeatureList&transparent=true" className="" spatialOffset={{ z: 100 }}>
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

var isEmbed = false
var pageName = (new URLSearchParams(window.location.search)).get("pageName");
if (pageName) {
    isEmbed = true
    // Clear the background
    document.documentElement.style.backgroundColor = "#FFFFFF00";
}
var MyTag = names[pageName ? pageName : "App"]

// Create react root
var root = document.createElement("div")
document.body.appendChild(root)
ReactDOM.createRoot(root).render(
    // <React.StrictMode>
    <MyTag></MyTag>
    // </React.StrictMode >,
)
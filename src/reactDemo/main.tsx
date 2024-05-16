import React, { ReactElement, useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import '../index.css'
import WebSpatial from '../../lib/webSpatial'
import ReactDomServer from 'react-dom/server';

function SpatialDiv(props: { webViewID: string, className: string, children: ReactElement | Array<ReactElement>, spatialOffset?: { x?: number, y?: number, z?: number } }) {
    if (!props.spatialOffset) {
        props.spatialOffset = { x: 0, y: 0, z: 0 }
    }
    if (props.spatialOffset.x === undefined) {
        props.spatialOffset.x = 0
    }
    if (props.spatialOffset.y === undefined) {
        props.spatialOffset.y = 0
    }
    if (props.spatialOffset.z === undefined) {
        props.spatialOffset.z = 0
    }

    const myDiv = useRef(null);
    useEffect(() => {
        var innerStr = ReactDomServer.renderToString(props.children)
        innerStr = innerStr.replace("remote-click", "onclick")
        console.log(innerStr)
        if (!(window as any).WebSpatailEnabled) {
            return
        }
        var a = async () => {

            await WebSpatial.createWebPanel("root", props.webViewID, "/index.html?pageName=reactDemo/basic.tsx", innerStr)

            var rect = (myDiv.current! as HTMLElement).getBoundingClientRect();

            var targetPosX = (rect.left + ((rect.right - rect.left) / 2))
            var targetPosY = (rect.bottom + ((rect.top - rect.bottom) / 2))

            await WebSpatial.updatePanelPose("root", props.webViewID, { x: targetPosX + props.spatialOffset!.x!, y: targetPosY + props.spatialOffset!.y!, z: props.spatialOffset!.z! }, rect.width, rect.height)
            setTimeout(() => {
                WebSpatial.updatePanelContent("root", props.webViewID, innerStr)
            }, 1000);

            WebSpatial.log("hit")
        }
        a()

        return () => { }
    })

    return (
        <div ref={myDiv} className={props.className}>
            {(window as any).WebSpatailEnabled ? <div /> : props.children}
        </div>
    )
}

function App() {
    return (
        <>
            <div className="flex text-white">
                <div className="text-xl p-20  m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
                    <h1>This is standard HTML</h1>
                </div>
            </div>

            <div className="flex text-white h-64">
                <SpatialDiv webViewID='A' className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center h-64" spatialOffset={{ z: 100 }}>
                    <div className="text-white bg-red-300 bg-opacity-20 flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
                        <p className='text-center'>Hello world</p>
                    </div>
                </SpatialDiv>
                <SpatialDiv webViewID='B' className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center h-64" spatialOffset={{ z: 50 }}>
                    <div className="text-white bg-green-300  bg-opacity-10 flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
                        <p className='text-center' remote-click="(window).wx.log('trevor here')">Hello world 2</p>
                    </div>
                </SpatialDiv>
                <SpatialDiv webViewID='C' className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center h-64" spatialOffset={{ z: 25 }}>
                    <div className="text-white bg-blue-300  bg-opacity-10 flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
                        <p className='text-center'>Hello world 5</p>
                    </div>
                </SpatialDiv>
                <SpatialDiv webViewID='D' className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center h-64" spatialOffset={{ z: 10 }}>
                    <div className="text-white bg-yellow-300  bg-opacity-10 flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
                        <p className='text-center'>Hello world</p>
                    </div>
                </SpatialDiv>

            </div>
            <div className="flex m-10 bg-red-300 bg-opacity-5 text-white h-64"></div>
            <div className="flex m-10 bg-red-300 bg-opacity-5 text-white h-64"></div>
            <div className="flex m-10 bg-red-300 bg-opacity-5 text-white h-64"></div>
        </>
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode >,
)


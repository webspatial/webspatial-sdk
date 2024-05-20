import React, { ReactElement, useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import '../src/index.css'
import WebSpatial from './webSpatial'
import ReactDomServer from 'react-dom/server';

export function SpatialDebug() {
    return (
        <div>
            debug
        </div>
    )
}

export function SpatialDiv(props: { webViewID: string, className: string, children: ReactElement | Array<ReactElement>, spatialOffset?: { x?: number, y?: number, z?: number } }) {
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
        if (!(window as any).WebSpatailEnabled) {
            return
        }

        var innerStr = ReactDomServer.renderToString(props.children)
        innerStr = innerStr.replace("remote-click", "onclick")

        var resizeDiv = async () => {
            var rect = (myDiv.current! as HTMLElement).getBoundingClientRect();
            var targetPosX = (rect.left + ((rect.right - rect.left) / 2))
            var targetPosY = (rect.bottom + ((rect.top - rect.bottom) / 2)) + window.scrollY
            await WebSpatial.updatePanelPose("root", props.webViewID, { x: targetPosX + props.spatialOffset!.x!, y: targetPosY + props.spatialOffset!.y!, z: props.spatialOffset!.z! }, rect.width, rect.height)
        }
        var setContent = async () => {
            await WebSpatial.createWebPanel("root", props.webViewID, "/index.html?pageName=reactDemo/basic.tsx", innerStr)
            await WebSpatial.updatePanelContent("root", props.webViewID, innerStr)
            await resizeDiv()
        }
        setContent()
        addEventListener("resize", resizeDiv);

        return () => {
            removeEventListener("resize", resizeDiv)
        }
    }, [])

    return (
        <div ref={myDiv} className={props.className}>
            {(window as any).WebSpatailEnabled ? <div /> : props.children}
        </div>
    )
}


export function SpatialModel(props: { webViewID: string, className: string, children?: ReactElement | Array<ReactElement>, spatialOffset?: { x?: number, y?: number, z?: number } }) {
    props = { ...{ spatialOffset: { x: 0, y: 0, z: 0 } }, ...props }
    if (props.spatialOffset!.x === undefined) {
        props.spatialOffset!.x = 0
    }
    if (props.spatialOffset!.y === undefined) {
        props.spatialOffset!.y = 0
    }
    if (props.spatialOffset!.z === undefined) {
        props.spatialOffset!.z = 0
    }

    const myDiv = useRef(null);
    useEffect(() => {
        if (!(window as any).WebSpatailEnabled) {
            return
        }

        var resizeDiv = async () => {
            var element = (myDiv.current! as HTMLElement)
            var rect = element.getBoundingClientRect();
            var curPosX = (rect.left + ((rect.right - rect.left) / 2))
            var curPosY = (rect.bottom + ((rect.top - rect.bottom) / 2)) + window.scrollY
            await WebSpatial.updateDOMModelPosition("root", "root", props.webViewID, { x: curPosX, y: curPosY, z: props.spatialOffset!.z! })
        }
        var setContent = async () => {
            await WebSpatial.createDOMModel("root", "root", props.webViewID, "http://10.73.196.42:5173/src/assets/FlightHelmet.usdz")
            await resizeDiv()
        }
        setContent()

        addEventListener("resize", resizeDiv);

        return () => {
            removeEventListener("resize", resizeDiv)
        }
    }, [])

    return (
        <div ref={myDiv} className={props.className}>
            {((window as any).WebSpatailEnabled) ? <div /> : props.children}
        </div>
    )
}

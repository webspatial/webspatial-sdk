import React, { CSSProperties, ReactElement, useEffect, useRef, useState } from 'react'
import { initializeSpatialOffset } from './utils'
import { _incSpatialUIInstanceIDCounter } from './_SpatialUIInstanceIDCounter'
import { SpatialWindowManager } from './SpatialWindowManager'
import { vecType } from './types'
import { SpatialWindowComponent } from '../core'
import { spatial } from '../utils/getSession'

// React components
/** @hidden */
export function SpatialIFrame(props: { innerHTMLContent?: string, onload?: (x: SpatialWindowComponent) => void, className: string, style?: CSSProperties | undefined, styleString?: string, children?: ReactElement | Array<ReactElement>, src: string, spatialOffset?: { x?: number, y?: number, z?: number } }) {
    props = { ...{ spatialOffset: { x: 0, y: 0, z: 0 } }, ...props }
    initializeSpatialOffset(props.spatialOffset!)

    // Since we do initialize/cleanup async we need to keep track of state for all instances
    let instanceState = useRef({} as { [id: string]: SpatialWindowManager })
    let currentInstanceID = useRef(0)

    const myDiv = useRef(null);
    async function resizeDiv() {
        instanceState.current[currentInstanceID.current].resize((myDiv.current! as HTMLElement).getBoundingClientRect(), props.spatialOffset as vecType)
    }
    async function setContent(savedId: number, str: string) {
        await instanceState.current[savedId].init(props.src);

        await resizeDiv();
        if (props.onload) {
            props.onload(instanceState.current[savedId].webview!)
        }
    }

    useEffect(() => {
        if (!spatial.isSupported()) {
            return
        }

        if (props.styleString) {
            (myDiv.current! as HTMLElement).setAttribute('style', props.styleString);
        }

        // We need to be very careful with currentInstanceID as it can get overwritten mid async call, to handle this we create state per new instance and then we must cache the id to align our create/destroy logic
        currentInstanceID.current = _incSpatialUIInstanceIDCounter()
        instanceState.current[currentInstanceID.current] = new SpatialWindowManager()
        window.addEventListener("resize", resizeDiv);

        setContent(currentInstanceID.current, "");

        return () => {
            // Get reference to id so it isn't overwritten when a new instance is created
            var savedId = currentInstanceID.current;
            removeEventListener("resize", resizeDiv);
            (async () => {

                await instanceState.current[savedId].destroy()
                delete instanceState.current[savedId];
            })()
        }
    }, [])

    useEffect(() => {
        if (!spatial.isSupported()) {
            return
        }
        resizeDiv()
        return () => {
        }
    }, [props.spatialOffset])

    return (
        <div ref={myDiv} style={{ visibility: "hidden" }} className={props.className} >
            {props.children}
        </div>
    )
}
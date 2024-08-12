import React, { ReactElement, useEffect, useRef,  } from 'react'
import { initializeSpatialOffset } from './utils'
import { SpatialModelUIManager } from './SpatialModelUIManager'
import { _incSpatialUIInstanceIDCounter } from './_SpatialUIInstanceIDCounter'
import { vecType } from './types'
 

{/* <model interactive width="670" height="1191">
<source src="assets/FlightHelmet.usdz" type="model/vnd.usdz+zip" />
<source src="assets/FlightHelmet.glb" type="model/gltf-binary" />
<picture>
  <img src="assets/FlightHelmet.png" width="670" height="1191" />
</picture>
</model> */}

/**
 * Allows embedding 3D graphical content inline within the webpage. Behaves similar to an img element but displays a 3D model instead
 * 
 * Intended to behave similar to https://immersive-web.github.io/model-element/ 
 */
export function Model(props: { className: string, children: ReactElement | Array<ReactElement>, spatialOffset?: { x?: number, y?: number, z?: number } }) {
    props = { ...{ spatialOffset: { x: 0, y: 0, z: 0 } }, ...props }
    initializeSpatialOffset(props.spatialOffset!)

    let instanceState = useRef({} as { [id: string]: SpatialModelUIManager })
    let currentInstanceID = useRef(0)

    const myDiv = useRef(null);
    async function resizeDiv() {
        instanceState.current[currentInstanceID.current].resize((myDiv.current! as HTMLElement), props.spatialOffset as vecType);
    }
    async function setContent(savedId: number, src: string) {
        await instanceState.current[savedId].init(src);
        await resizeDiv();
    }

    useEffect(() => {
        // Created
        currentInstanceID.current = _incSpatialUIInstanceIDCounter()
        instanceState.current[currentInstanceID.current] = new SpatialModelUIManager()
        window.addEventListener("resize", resizeDiv);
        (async () => {
            var savedId = currentInstanceID.current
            var srcAr = new Array<string>()
            React.Children.forEach(props.children, async (element) => {
                srcAr.push(element.props.src);
            });
            setContent(savedId, srcAr[0])
        })()
        return () => {
            // destroyed
            var savedId = currentInstanceID.current;
            removeEventListener("resize", resizeDiv);
            (async () => {
                await instanceState.current[savedId].destroy()
                delete instanceState.current[savedId];
            })()
        }
    }, [])

    useEffect(() => {
        resizeDiv()
        return () => {
        }
    }, [props.spatialOffset])

    return (
        <div ref={myDiv} className={props.className} />
    )
}

import React, { ReactElement, useEffect, useRef, forwardRef, useImperativeHandle, Ref } from 'react'
import { initializeSpatialOffset } from './utils'
import { SpatialModelUIManager } from './SpatialModelUIManager'
import { _incSpatialUIInstanceIDCounter } from './_SpatialUIInstanceIDCounter'
import { vecType } from './types'


// 定义子组件的 props 类型
interface ModelProps {
    className: string,
    children: ReactElement | Array<ReactElement>,
    spatialOffset?: { x?: number, y?: number, z?: number }
}

export type ModelRef = Ref<{ 
    animateOpacityFadeIn: (easeFn: ModelAnimateOpacityEaseFn, durationSeconds: number) => void,
    animateOpacityFadeOut: (easeFn: ModelAnimateOpacityEaseFn, durationSeconds: number) => void
 }>

export enum ModelAnimateOpacityEaseFn {
    easeInOut = 'easeInOut'
}

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
export const Model = forwardRef((props: ModelProps, ref: ModelRef) => {
    props = { ...{ spatialOffset: { x: 0, y: 0, z: 0 } }, ...props }
    initializeSpatialOffset(props.spatialOffset!)

    const animateOpacityFadeIn = (easeFn: ModelAnimateOpacityEaseFn, durationSeconds: number) => {
        // To be implemented
        const spatialModelUIManager = instanceState.current[currentInstanceID.current];
        const animationDescription = {fadeOut: false, fadeDuration: durationSeconds}
        spatialModelUIManager.modelComponent?.applyAnimationToResource(animationDescription)
    };

    const animateOpacityFadeOut = (easeFn: ModelAnimateOpacityEaseFn, durationSeconds: number) => {
        // To be implemented
        const spatialModelUIManager = instanceState.current[currentInstanceID.current];
        const animationDescription = {fadeOut: true, fadeDuration: durationSeconds}
        spatialModelUIManager.modelComponent?.applyAnimationToResource(animationDescription)
    };

    useImperativeHandle(ref, () => ({
        animateOpacityFadeIn,
        animateOpacityFadeOut
    }));

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
})

import React, { CSSProperties, ReactElement, useEffect, useRef } from 'react'
import { Spatial, SpatialEntity, SpatialIFrameComponent, SpatialModelComponent, SpatialModelUIComponent, SpatialSession } from './index';
type vecType = { x: number, y: number, z: number }

// Create the default Spatial session for the app
var _currentSession = null as SpatialSession | null
export async function getSessionAsync() {
    if (_currentSession) {
        return _currentSession
    }
    _currentSession = await new Spatial().requestSession()
    return _currentSession
}

// Cleanup param helpers
function initializeSpatialOffset(offset: any) {
    if (offset.x === undefined) {
        offset.x = 0
    }
    if (offset.y === undefined) {
        offset.y = 0
    }
    if (offset.z === undefined) {
        offset.z = 0
    }
}

// Manager classes to handle resource creation/deletion
class SpatialIFrameManager {
    initPromise?: Promise<any>
    entity?: SpatialEntity
    webview?: SpatialIFrameComponent

    async initInternal(url: string) {
        this.entity = await (await getSessionAsync()).createEntity()
        await this.entity.setParentWindowGroup(await (await getSessionAsync()).getCurrentWindowGroup())
        this.webview = await (await getSessionAsync()).createIFrameComponent()
        await this.webview.loadURL(url)
        await this.entity.setComponent(this.webview)
    }
    async init(url: string) {
        this.initPromise = this.initInternal(url)
        await this.initPromise
    }
    async resize(element: HTMLElement, offset: vecType) {
        let rect = element.getBoundingClientRect();
        let targetPosX = (rect.left + ((rect.right - rect.left) / 2))
        let targetPosY = (rect.bottom + ((rect.top - rect.bottom) / 2)) + window.scrollY
        if (!this.webview) {
            return
        }
        var entity = this.entity!
        entity.transform.position.x = targetPosX + offset.x
        entity.transform.position.y = targetPosY + offset.y
        entity.transform.position.z = offset.z
        await entity.updateTransform()

        var webview = this.webview!
        await webview.setResolution(rect.width, rect.height)
    }
    async destroy() {
        if (this.initPromise) {
            await this.initPromise
            this.entity?.destroy()
            this.webview?.destroy()
        }
    }
}

class SpatialModelUIManager {
    initPromise?: Promise<any>
    entity?: SpatialEntity
    modelComponent?: SpatialModelUIComponent

    async initInternal(url: string) {
        this.entity = await (await getSessionAsync()).createEntity()
        await this.entity.setParentWindowGroup(await (await getSessionAsync()).getCurrentWindowGroup())
        this.modelComponent = await (await getSessionAsync()).createModelUIComponent()
        await this.modelComponent.setURL(url)
        await this.entity.setComponent(this.modelComponent)
    }
    async init(url: string) {
        this.initPromise = this.initInternal(url)
        await this.initPromise
    }
    async resize(element: HTMLElement, offset: vecType) {
        let rect = element.getBoundingClientRect();
        let targetPosX = (rect.left + ((rect.right - rect.left) / 2))
        let targetPosY = (rect.bottom + ((rect.top - rect.bottom) / 2)) + window.scrollY
        if (!this.modelComponent) {
            return
        }
        var entity = this.entity!
        entity.transform.position.x = targetPosX + offset.x
        entity.transform.position.y = targetPosY + offset.y
        entity.transform.position.z = offset.z
        await entity.updateTransform()

        var modelComponent = this.modelComponent!
        await modelComponent.setResolution(rect.width, rect.height);

        await modelComponent.setAspectRatio("fit");
    }
    async destroy() {
        if (this.initPromise) {
            await this.initPromise
            this.entity?.destroy()
            this.modelComponent?.destroy()
        }
    }
}


// React components
let _SpatialUIInstanceIDCounter = 0
export function SpatialIFrame(props: { onload?: (x: SpatialIFrameComponent) => void, className: string, style?: CSSProperties | undefined, children?: ReactElement | Array<ReactElement>, src: string, spatialOffset?: { x?: number, y?: number, z?: number } }) {
    props = { ...{ spatialOffset: { x: 0, y: 0, z: 0 } }, ...props }
    initializeSpatialOffset(props.spatialOffset!)

    // Since we do initialize/cleanup async we need to keep track of state for all instances
    let instanceState = useRef({} as { [id: string]: SpatialIFrameManager })
    let currentInstanceID = useRef(0)

    const myDiv = useRef(null);
    async function resizeDiv() {
        instanceState.current[currentInstanceID.current].resize((myDiv.current! as HTMLElement), props.spatialOffset as vecType)
    }
    async function setContent(savedId: number, str: string) {
        await instanceState.current[savedId].init(props.src);

        await resizeDiv();
        if (props.onload) {
            props.onload(instanceState.current[savedId].webview!)
        }
    }

    useEffect(() => {
        if (!(window as any).WebSpatailEnabled) {
            return
        }

        // We need to be very careful with currentInstanceID as it can get overwritten mid async call, to handle this we create state per new instance and then we must cache the id to align our create/destroy logic
        currentInstanceID.current = ++_SpatialUIInstanceIDCounter
        instanceState.current[currentInstanceID.current] = new SpatialIFrameManager()
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
        resizeDiv()
        return () => {
        }
    }, [props.spatialOffset])

    return (
        <div ref={myDiv} style={props.style} className={props.className}>
        </div>
    )
}

{/* <model interactive width="670" height="1191">
<source src="assets/FlightHelmet.usdz" type="model/vnd.usdz+zip" />
<source src="assets/FlightHelmet.glb" type="model/gltf-binary" />
<picture>
  <img src="assets/FlightHelmet.png" width="670" height="1191" />
</picture>
</model> */}
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
        currentInstanceID.current = ++_SpatialUIInstanceIDCounter
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
        <div ref={myDiv} className={props.className}>
        </div>
    )
}
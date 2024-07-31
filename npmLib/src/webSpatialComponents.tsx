import React, { CSSProperties, ReactElement, useEffect, useRef, useState } from 'react'
import { Spatial, SpatialEntity, SpatialIFrameComponent, SpatialModelUIComponent, SpatialSession } from './index';
import { createPortal } from 'react-dom';

type vecType = { x: number, y: number, z: number }

// Create the default Spatial session for the app
let spatial = new Spatial()
let _currentSession = null as SpatialSession | null
/** @hidden */
export function getSessionAsync() {
    if (!spatial.isSupported()) {
        return null
    }
    if (_currentSession) {
        return _currentSession
    }
    _currentSession = spatial.requestSession()
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
        this.entity = await (await getSessionAsync()!).createEntity()
        await this.entity.setParentWindowGroup(await (await getSessionAsync()!).getCurrentWindowGroup())
        this.webview = await (await getSessionAsync()!).createIFrameComponent()
        await this.webview.loadURL(url)
        await this.webview.setInline(true);
        await this.webview.setScrollEnabled(false);
        await this.entity.setComponent(this.webview)
    }
    async initInternalFromWindow(w: any) {
        this.entity = await (await getSessionAsync()!).createEntity()
        await this.entity.setParentWindowGroup(await (await getSessionAsync()!).getCurrentWindowGroup())
        this.webview = await (await getSessionAsync()!).createIFrameComponent()
        await this.webview.setFromWindow(w)
        await this.webview.setInline(true);
        await this.webview.setScrollEnabled(false);
        await this.entity.setComponent(this.webview)
    }
    async init(url: string) {
        this.initPromise = this.initInternal(url)
        await this.initPromise
    }
    async initFromWidow(w: any) {
        this.initPromise = this.initInternalFromWindow(w)
        await this.initPromise
    }
    async resize(domRect: DOMRect, offset: vecType) {
        let rect = domRect
        let targetPosX = (rect.left + ((rect.right - rect.left) / 2))
        let targetPosY = (rect.bottom + ((rect.top - rect.bottom) / 2)) + window.scrollY
        if (!this.webview) {
            return
        }
        var entity = this.entity!
        entity.transform.position.x = targetPosX + (offset ? offset.x : 0)
        entity.transform.position.y = targetPosY + (offset ? offset.y : 0)
        entity.transform.position.z = (offset ? offset.z : 0)
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
        this.entity = await (await getSessionAsync()!).createEntity()
        await this.entity.setParentWindowGroup(await (await getSessionAsync()!).getCurrentWindowGroup())
        this.modelComponent = await (await getSessionAsync()!).createModelUIComponent()
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
/** @hidden */
export function SpatialIFrame(props: { innerHTMLContent?: string, onload?: (x: SpatialIFrameComponent) => void, className: string, style?: CSSProperties | undefined, styleString?: string, children?: ReactElement | Array<ReactElement>, src: string, spatialOffset?: { x?: number, y?: number, z?: number } }) {
    props = { ...{ spatialOffset: { x: 0, y: 0, z: 0 } }, ...props }
    initializeSpatialOffset(props.spatialOffset!)

    // Since we do initialize/cleanup async we need to keep track of state for all instances
    let instanceState = useRef({} as { [id: string]: SpatialIFrameManager })
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

{/* <model interactive width="670" height="1191">
<source src="assets/FlightHelmet.usdz" type="model/vnd.usdz+zip" />
<source src="assets/FlightHelmet.glb" type="model/gltf-binary" />
<picture>
  <img src="assets/FlightHelmet.png" width="670" height="1191" />
</picture>
</model> */}
/** @hidden */
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



/**
 * Hook to manage multiple instances of objects that could be initialized as async
 */
function useAsyncInstances<T>(
    createInstance: () => T,
    destroyInstance: (instance: T) => void,
    dependencies: React.DependencyList | undefined
) {
    let instanceState = useRef({} as { [id: number]: T })
    let currentInstanceID = useRef(0)

    useEffect(() => {
        currentInstanceID.current = ++_SpatialUIInstanceIDCounter
        let currentVal = currentInstanceID.current
        instanceState.current[currentVal] = createInstance()
        return () => {
            destroyInstance(instanceState.current[currentVal])
            delete instanceState.current[currentVal]
        }
    }, [])
    return {
        getActiveInstance() {
            var i = instanceState.current[currentInstanceID.current]
            return i ? i : null
        }
    }
}


/**
 * Component that extends the div tag that allows the inner contents to be posisioned in 3D space
 * 
 * Note: Inner html will actually be placed within a separate window element so directly accessing the dom elements may cause unexpected behavior
 */
export function SpatialDiv(props: { children?: ReactElement | Array<ReactElement>, style?: CSSProperties | undefined }) {
    let childrenSizeRef = useRef(null as null | HTMLDivElement)
    let iframeRef = useRef(null as null | HTMLIFrameElement)
    const [portalEl, setPortalEl] = useState(null as null | HTMLElement)
    const [isCustomElement, setIsCustomElement] = useState(false)
    let customElEnabled = false
    let customElements = null as null | HTMLElement


    let mode = "none"
    let session = getSessionAsync()
    if (session) {
        mode = "spatial"
    }

    useEffect(() => {
        if (mode == "none") {
            return
        }

        // Detect if we are running within a custom element instead of react
        if ((props as any).container) {
            let containerHtml: string = (props as any).container.host.innerHTML.trim()
            if (!props.children && containerHtml.length != 0) {
                setIsCustomElement(true)
                customElEnabled = true
                customElements = document.createElement("div")
                for (let el of (props as any).container.host.children) {
                    customElements.appendChild(el)
                }
                if (iframeRef.current) {
                    iframeRef.current!.contentWindow!.document.body.appendChild(customElements!)
                }
            }
        }
    }, [])


    if (mode === "none") { // Used for debugging purposes
        return <div style={props.style}>
            {!isCustomElement ? <>
                {props.children}
            </> : <slot></slot>}
        </div>
    } else if (mode === "iframe") {  // Used to simulate behavior but without spatial (useful for debugging)
        useEffect(() => {
            let i = iframeRef.current! as HTMLIFrameElement;
            i.contentWindow!.document.body.style.margin = "0px"
            i.contentWindow!.document.body.style.overflow = "hidden"
            i.contentWindow!.document.documentElement.style.backgroundColor = "transparent"
            // Copy styles
            var links = document.getElementsByTagName("link")
            for (var l of links) {
                if (l.rel == "stylesheet") {
                    var styleEl = l.cloneNode(true)
                    i.contentWindow!.document.head.appendChild(styleEl)
                }
            }

            // Watch for resize
            let ro = new ResizeObserver((entries) => {
                iframeRef.current!.style.height = i.contentWindow!.document.body.scrollHeight.toString() + "px"
            })
            ro.observe(i.contentWindow!.document.body)
            setPortalEl(i.contentWindow!.document.body)

            return () => {
                // Cleanup
                ro.disconnect()
                setPortalEl(null)
            }
        }, [])
        return <>
            <iframe ref={iframeRef} frameBorder="0" style={{ width: "100%", overflow: "hidden" }}></iframe>
            {portalEl ? <>
                {createPortal(<>
                    {props.children}
                </>, portalEl)}
            </> : <></>}
        </>
    } else if (mode === "spatial") { // Behavior on spatial
        let iframeInstance = useAsyncInstances(() => {
            // Open window and set style
            let openedWindow = window.open();
            openedWindow!.document.documentElement.style.backgroundColor = "transparent"
            openedWindow!.document.documentElement.style.cssText += document.documentElement.style.cssText
            openedWindow!.document.body.style.margin = "0px"
            openedWindow!.document.head.innerHTML = `
                <meta charset="UTF-8">
                <title>WebSpatial</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            `
            var links = document.getElementsByTagName("link")
            for (var l of links) {
                if (l.rel == "stylesheet") {
                    var styleEl = l.cloneNode(true)
                    openedWindow!.document.head.appendChild(styleEl)
                }
            }

            if (customElEnabled) {
                openedWindow!.document.body.appendChild(customElements!)
            } else {
                // Create portal
                setPortalEl(openedWindow!.document.body)
            }

            // Create spatial iframe
            let iframeMngr = new SpatialIFrameManager()
            iframeMngr.initFromWidow(openedWindow!).then(async () => {
                // Set style
                await iframeMngr.webview?.setStyle({ transparentEffect: true, glassEffect: false, cornerRadius: 0 })
                await resizeSpatial()
            })

            return iframeMngr
        }, (instance) => {
            instance.destroy()
        }, [])

        // Handle resizing
        let resizeSpatial = async () => {
            var ins = iframeInstance.getActiveInstance()
            if (ins) {

                let rect = childrenSizeRef.current!.getBoundingClientRect()
                if (customElEnabled) {
                    let p = customElements!.parentElement!
                    childrenSizeRef.current!.appendChild(customElements!)
                    rect = childrenSizeRef.current!.getBoundingClientRect()
                    p.appendChild(customElements!)
                }
                await ins.resize(rect, { x: 0, y: 0, z: 50 })
            }
        }
        useEffect(() => {
            window.addEventListener("resize", resizeSpatial);
            return () => {
                window.removeEventListener("resize", resizeSpatial);
            }
        })

        return <>
            <div ref={childrenSizeRef} style={{ ...props.style, ...{ visibility: "hidden" } }}  >
                {props.children}
            </div>
            {!isCustomElement && portalEl ? <>
                {createPortal(<div style={{ ...props.style, ...{ width: "", height: "" } }}>
                    {props.children}
                </div>, portalEl)}
            </> : <></>}
        </>
    }
}
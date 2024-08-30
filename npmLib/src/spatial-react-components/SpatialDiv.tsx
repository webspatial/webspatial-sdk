import React, { CSSProperties, ReactElement, useEffect, useRef, useState, forwardRef, Ref, useImperativeHandle, createContext, useContext } from 'react'
import { createPortal } from 'react-dom';
import { spatialStyleDef } from './types'
import { getSession } from '../utils';
import { SpatialWindowManager } from './SpatialWindowManager'
import { _incSpatialUIInstanceIDCounter } from './_SpatialUIInstanceIDCounter'

const SpatialDivContext = createContext(null as null | SpatialWindowManager);

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
        currentInstanceID.current = _incSpatialUIInstanceIDCounter()
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


function getInheritedStyleProps(from: HTMLElement): any {
    //https://stackoverflow.com/questions/5612302/which-css-properties-are-inherited
    var propNames = [
        "azimuth",
        "borderCollapse",
        "borderSpacing",
        "captionSide",
        "color",
        "cursor",
        "direction",
        "elevation",
        "emptyCells",
        "fontFamily",
        "fontSize",
        "fontStyle",
        "fontVariant",
        "fontWeight",
        "font",
        "letterSpacing",
        "lineHeight",
        "listStyleImage",
        "listStylePosition",
        "listStyleType",
        "listStyle",
        "orphans",
        "pitchRange",
        "pitch",
        "quotes",
        "richness",
        "speakHeader",
        "speakNumeral",
        "speakPunctuation",
        "speak",
        "speechRate",
        "stress",
        "textAlign",
        "textIndent",
        "textTransform",
        "visibility",
        "voiceFamily",
        "volume",
        "whiteSpace",
        "widows",
        "wordSpacing",
    ]
    var props = {} as any
    var styleObject = getComputedStyle(from)
    for (var cssName of propNames) {
        if ((styleObject as any)[cssName]) {
            props[cssName] = (styleObject as any)[cssName]
        }
    }
    return props
}

interface SpatialDivProps {
    allowScroll?: boolean,
    scrollWithParent?: boolean,
    spatialStyle?: Partial<spatialStyleDef>,
    children?: ReactElement | JSX.Element | Array<ReactElement | JSX.Element>,
    className?: string,
    style?: CSSProperties | undefined
    // TBF: when disableSpatial, display as normal div in current webview
    disableSpatial?: boolean,
    debugName?: string
}

export type SpatialDivRef = Ref<{
    // animate :(animationBuilder: AnimationBuilder) => void,
    getBoundingClientRect: () => DOMRect
}>


/**
 * Component that extends the div tag that allows the inner contents to be posisioned in 3D space
 * 
 * Note: Inner html will actually be placed within a separate window element so directly accessing the dom elements may cause unexpected behavior
 */
export const SpatialDiv = forwardRef((props: SpatialDivProps, ref: SpatialDivRef) => {
    const parentSpatialDiv = useContext(SpatialDivContext)

    let isVisibleRef = useRef(null as null | HTMLDivElement)
    let childrenSizeRef = useRef(null as null | HTMLDivElement)
    const [elWidth, setElWidth] = useState(0)
    const [elHeight, setElHeight] = useState(0)
    let iframeRef = useRef(null as null | HTMLIFrameElement)
    const [portalEl, setPortalEl] = useState(null as null | HTMLElement)
    const [isCustomElement, setIsCustomElement] = useState(false)
    let customElEnabled = false
    let customElements = null as null | HTMLElement


    let mode = "none"
    let session = getSession()
    if (session) {
        mode = "spatial"
    }

    useImperativeHandle(ref, () => ({
        getBoundingClientRect() {
            return (childrenSizeRef.current! as HTMLElement).getBoundingClientRect();
        }
    }));

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
    }, []);

    if (mode === "none") { // Used for debugging purposes
        return <div className={props.className} style={props.style} ref={childrenSizeRef} >
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

        async function setViewport(openedWindow?: WindowProxy) {
            if (!openedWindow) return;
            const bodyWidth = document.body.getBoundingClientRect().width;
            const viewport = openedWindow?.document.querySelector('meta[name="viewport"]')
            viewport?.setAttribute('content', `width=${bodyWidth}, initial-scale=1.0 user-scalable=no`)
            await windowInstance.getActiveInstance()?.webview?.setScrollEdgeInsets({ top: 0, left: 0, bottom: 0, right: elWidth - bodyWidth })
        }

        let windowInstance = useAsyncInstances(() => {
            // session?.log("TREVORX " + props.debugName + " " + (parentSpatialDiv !== null ? "hasParent" : "NoParent"))
            if (getInheritedStyleProps(isVisibleRef.current!).visibility == "hidden") {
                return null
            }
            // Open window and set style
            let openedWindow = window.open();
            openedWindow!.document.documentElement.style.backgroundColor = "transparent"
            openedWindow!.document.documentElement.style.cssText += document.documentElement.style.cssText
            openedWindow!.document.body.style.margin = "0px"

            // Overwrite link href to navigate the parents page
            openedWindow!.document.onclick = function (e) {
                let element = (e.target) as HTMLElement | null;
                let found = false

                // Look for <a> element in the clicked elements parents and if found override navigation behavior if needed
                while (!found) {
                    if (element && (element).tagName == 'A') {
                        // When using libraries like react route's <Link> it sets an onclick event, when this happens we should do nothing and let that occur
                        if (!element.onclick) {
                            window.location.href = (element as HTMLAnchorElement).href
                        }
                        return false; // prevent default action and stop event propagation
                    }
                    if (element && element.parentElement) {
                        element = element.parentElement
                    } else {
                        break;
                    }
                }
            };

            // Synchronize head of parent page to this page to ensure styles are in sync
            document.head.addEventListener("DOMNodeInserted", () => {
                openedWindow!.document.head.innerHTML = document.head.innerHTML

                setViewport(openedWindow!);
            })
            openedWindow!.document.head.innerHTML = document.head.innerHTML

            if (customElEnabled) {
                openedWindow!.document.body.appendChild(customElements!)
            } else {
                // Create portal
                setPortalEl(openedWindow!.document.body)
            }

            // Create spatial window
            let windowMngr = new SpatialWindowManager()
            windowMngr.initFromWidow(openedWindow!).then(async () => {
                if (parentSpatialDiv !== null) {
                    await parentSpatialDiv.initPromise
                    windowMngr.entity!.setParent(parentSpatialDiv.entity!)
                }
                // Set style
                await windowMngr.webview?.setStyle({
                    transparentEffect: props.spatialStyle?.transparentEffect === undefined ? true : props.spatialStyle?.transparentEffect,
                    glassEffect: props.spatialStyle?.glassEffect === undefined ? false : props.spatialStyle?.glassEffect,
                    cornerRadius: props.spatialStyle?.cornerRadius === undefined ? 0 : props.spatialStyle?.cornerRadius,
                    materialThickness: props.spatialStyle?.materialThickness === undefined ? "none" : props.spatialStyle?.materialThickness
                })
                await resizeSpatial()
                await windowMngr.webview!.setScrollEnabled(props.allowScroll ? true : false)
                await windowMngr.webview!.setScrollWithParent(props.scrollWithParent === undefined ? true : props.scrollWithParent)
            })

            return windowMngr
        }, (instance) => {
            if (instance) {
                instance.destroy()
            }
        }, [])


        // Handle resizing
        let resizeSpatial = async () => {
            var ins = windowInstance.getActiveInstance()
            if (ins) {
                let rect = childrenSizeRef.current!.getBoundingClientRect()
                if (customElEnabled) {
                    let p = customElements!.parentElement!
                    childrenSizeRef.current!.appendChild(customElements!)
                    rect = childrenSizeRef.current!.getBoundingClientRect()
                    p.appendChild(customElements!)
                }
                await ins.resize(rect, { ...{ x: 0, y: 0, z: 1 }, ...props.spatialStyle?.position }, { ...{ x: 0, y: 0, z: 0, w: 1 }, ...props.spatialStyle?.rotation })

                await setViewport(ins.window)

                setElWidth(childrenSizeRef.current?.clientWidth!)
                setElHeight(childrenSizeRef.current?.clientHeight!)
            }
        }
        useEffect(() => {
            (async () => {
                var ins = windowInstance.getActiveInstance()
                if (ins) {
                    await ins.webview?.setStyle({
                        transparentEffect: props.spatialStyle?.transparentEffect === undefined ? true : props.spatialStyle?.transparentEffect,
                        glassEffect: props.spatialStyle?.glassEffect === undefined ? false : props.spatialStyle?.glassEffect,
                        cornerRadius: props.spatialStyle?.cornerRadius === undefined ? 0 : props.spatialStyle?.cornerRadius,
                        materialThickness: props.spatialStyle?.materialThickness === undefined ? "none" : props.spatialStyle?.materialThickness
                    })

                    await ins.webview?.setScrollEnabled(props.allowScroll ? true : false)
                    await ins.webview?.setScrollWithParent(props.scrollWithParent === undefined ? true : props.scrollWithParent)
                }
            })();
            resizeSpatial()
        }, [props.spatialStyle, props.allowScroll, props.scrollWithParent])

        useEffect(() => {
            let ro = new ResizeObserver((elements) => {
                resizeSpatial()
            })
            ro.observe(childrenSizeRef.current!)
            window.addEventListener("resize", resizeSpatial);
            return () => {
                window.removeEventListener("resize", resizeSpatial);
                ro.disconnect()
            }
        }, [])


        return <>
            <SpatialDivContext.Provider value={windowInstance.getActiveInstance()}>
                <div ref={isVisibleRef}></div>
                <div ref={childrenSizeRef} className={props.className} style={{ ...props.style, ...{ visibility: props.disableSpatial ? "visible" : "hidden" } }}  >
                    {props.children}
                </div>
                {!isCustomElement && portalEl && (getInheritedStyleProps(isVisibleRef.current!).visibility != "hidden") ? <>
                    {createPortal(<div className={props.className} style={{ ...getInheritedStyleProps(childrenSizeRef.current!), ...props.style, ...{ visibility: props.disableSpatial ? "hidden" : "visible", width: "" + elWidth + "px", height: "" + elHeight + "px", position: "", top: "", left: "", margin: "", marginLeft: "", marginRight: "", marginTop: "", marginBottom: "", overflow: "" } }}>
                        {props.children}
                    </div>, portalEl)}
                </> : <></>}
            </SpatialDivContext.Provider>
        </>
    }

})
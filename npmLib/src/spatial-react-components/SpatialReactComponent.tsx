import React, { CSSProperties, useEffect, useRef, useState, forwardRef, Ref, useImperativeHandle, createContext, useContext, ReactNode, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom';
import { spatialStyleDef } from './types'
import { getSession } from '../utils';
import { SpatialWindowManager } from './SpatialWindowManager'
import { _incSpatialUIInstanceIDCounter } from './_SpatialUIInstanceIDCounter'
import { useSpatialContentStyle } from './useSpatialContentStyle';

const SpatialReactComponentContext = createContext(null as null | SpatialWindowManager);
const SpatialIsStandardInstanceContext = createContext(null as null | boolean);

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


function getInheritedStyleProps(from: HTMLElement | undefined): any {
    if (from === undefined) {
        return {}
    }

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
export interface SpatialReactComponentProps {
    allowScroll?: boolean,
    scrollWithParent?: boolean,
    spatialStyle?: Partial<spatialStyleDef>,
    children?: ReactNode,
    className?: string,
    style?: CSSProperties | undefined

    component?: React.ElementType;

    // TBF: when disableSpatial, display as normal div in current webview
    disableSpatial?: boolean,
    debugName?: string
}

export type SpatialReactComponentRef = Ref<{
    // animate :(animationBuilder: AnimationBuilder) => void,
    getBoundingClientRect: () => DOMRect
}>

function syncParentHeadToChild(childWindow: WindowProxy) {
    for (let i = document.head.children.length - 1; i >= 0; i--) {
        let n = document.head.children[i].cloneNode(true)
        if (n.nodeName == "LINK" && (n as HTMLLinkElement).rel == "stylesheet" && (n as HTMLLinkElement).href) {
            // Safari seems to have a bug where 
            // ~1/50 loads, if the same url is loaded very quickly in a window and a child window, 
            // the second load request never is fired resulting in css not to be applied. 
            // Workaround this by making the css stylesheet request unique
            (n as HTMLLinkElement).href += ("?uniqueURL=" + Math.random());
            childWindow.document.head.appendChild(n)
        } else {
            childWindow.document.head.appendChild(n)
        }
    }
}

async function setViewport(windowInstance: any, elWidth: number, openedWindow?: WindowProxy,) {
    if (!openedWindow) return;
    const bodyWidth = document.body.getBoundingClientRect().width;
    const viewport = openedWindow?.document.querySelector('meta[name="viewport"]')
    viewport?.setAttribute('content', `width=${bodyWidth}, initial-scale=1.0 user-scalable=no`)
    await windowInstance.getActiveInstance()?.mnger.webview?.setScrollEdgeInsets({ top: 0, left: 0, bottom: 0, right: elWidth - bodyWidth })
}

/**
 * Component that extends the div tag that allows the inner contents to be posisioned in 3D space
 * 
 * Note: Inner html will actually be placed within a separate window element so directly accessing the dom elements may cause unexpected behavior
 */
export const SpatialReactComponent = forwardRef((props: SpatialReactComponentProps, ref: SpatialReactComponentRef) => {
    const parentSpatialReactComponent = useContext(SpatialReactComponentContext)
    const isStandard = useContext(SpatialIsStandardInstanceContext) // Spatial components render both a standard (hidden) and spatial instance (displayed), this prop lets us know which context we are in

    var getAllowScroll = () => {
        return props.allowScroll || (props.style?.overflow == "scroll")
    }

    var getIsFixed = () => {
        return (props.scrollWithParent == false) || (props.style?.position == "fixed")
    }


    let childrenSizeRef = useRef(null as null | HTMLDivElement)
    const [elWidth, setElWidth] = useState(0)
    const [elHeight, setElHeight] = useState(0)
    let iframeRef = useRef(null as null | HTMLIFrameElement)
    const [portalEl, setPortalEl] = useState(null as null | HTMLElement)
    const [isCustomElement, setIsCustomElement] = useState(false)
    let customElEnabled = false
    let customElements = null as null | HTMLElement

    const { className, component, allowScroll, spatialStyle, debugName, scrollWithParent, disableSpatial, ...otherProps } = props;
    const El = component ? component : 'div';
    const isPrimitiveEl = typeof El === 'string';

    let mode = "none"
    let session = getSession()
    if (session) {
        mode = "spatial"
    }
    function getTargetStandardNode() {
        return isPrimitiveEl ? childrenSizeRef.current : childrenSizeRef.current?.firstElementChild as HTMLElement
    }

    useImperativeHandle(ref, () => ({
        getBoundingClientRect() {
            return (getTargetStandardNode() as HTMLElement).getBoundingClientRect();
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
        const renderPrimiveComponent = () => (<El className={props.className} style={props.style} ref={childrenSizeRef}  {...otherProps} >
            {!isCustomElement ? <>
                {props.children}
            </> : <slot></slot>}
        </El>);
        const renderWrappedComponent = () => (<div ref={childrenSizeRef}>
            <El className={props.className} style={props.style}  {...otherProps}  >
                {!isCustomElement ? <>
                    {props.children}
                </> : <slot></slot>}
            </El>
        </div>);

        return isPrimitiveEl ? renderPrimiveComponent() : renderWrappedComponent()
    } else if (mode === "iframe") {  // Used to simulate behavior but without spatial (useful for debugging)
        useEffect(() => {
            let i = iframeRef.current! as HTMLIFrameElement;
            i.contentWindow!.document.body.style.margin = "0px"
            i.contentWindow!.document.body.style.overflow = "hidden"
            i.contentWindow!.document.documentElement.style.backgroundColor = "transparent"
            // Copy styles
            var links = document.getElementsByTagName("link")
            const linksArray = Array.from(links);
            for (var l of linksArray) {
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
        let windowInstance = useAsyncInstances(() => {
            // session?.log("TREVORX " + props.debugName + " " + (parentSpatialReactComponent !== null ? "hasParent" : "NoParent"))
            if (isStandard === true) {
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
            let headObserver = new MutationObserver((mutations) => {
                if (openedWindow) {
                    syncParentHeadToChild(openedWindow)
                    setViewport(windowInstance, elWidth, openedWindow);
                }
            })
            headObserver.observe(document.head, { childList: true, subtree: true, })

            syncParentHeadToChild(openedWindow!)

            if (customElEnabled) {
                openedWindow!.document.body.appendChild(customElements!)
            } else {
                // Create portal
                setPortalEl(openedWindow!.document.body)
            }

            // Create spatial window
            let windowMngr = new SpatialWindowManager()
            windowMngr.initFromWidow(openedWindow!).then(async () => {
                if (parentSpatialReactComponent !== null) {
                    await parentSpatialReactComponent.initPromise
                    windowMngr.entity!.setParent(parentSpatialReactComponent.entity!)
                }
                // Set style
                await windowMngr.webview?.setStyle({
                    transparentEffect: props.spatialStyle?.transparentEffect === undefined ? true : props.spatialStyle?.transparentEffect,
                    glassEffect: props.spatialStyle?.glassEffect === undefined ? false : props.spatialStyle?.glassEffect,
                    cornerRadius: props.spatialStyle?.cornerRadius === undefined ? 0 : props.spatialStyle?.cornerRadius,
                    materialThickness: props.spatialStyle?.materialThickness === undefined ? "none" : props.spatialStyle?.materialThickness
                })
                await resizeSpatial()
                await windowMngr.webview!.setScrollEnabled(getAllowScroll())
                await windowMngr.webview!.setScrollWithParent(!getIsFixed())
            })

            return { mnger: windowMngr, headObserver: headObserver }
        }, (instance) => {
            if (instance) {
                instance.headObserver.disconnect()
                instance.mnger.destroy()
            }
        }, [])

        // Handle resizing
        let resizeSpatial = async () => {

            var ins = windowInstance.getActiveInstance()?.mnger
            if (ins) {
                const targetStandardNode = getTargetStandardNode()
                let rect = targetStandardNode!.getBoundingClientRect()
                if (customElEnabled) {
                    let p = customElements!.parentElement!
                    childrenSizeRef.current!.appendChild(customElements!)
                    rect = childrenSizeRef.current!.getBoundingClientRect()
                    p.appendChild(customElements!)
                }

                let offset = { ...{ x: 0, y: 0, z: 1 }, ...props.spatialStyle?.position }
                if (spatialStyle?.current.zOffset !== undefined) {
                    offset.z = spatialStyle.current.zOffset
                }


                if ((targetStandardNode?.style as any).back !== undefined) {
                    // inline-style have high priority than global style
                    // parse style.back
                    let back = parseFloat((targetStandardNode?.style as any).back)
                    offset.z = back;
                }

                await ins.resize(rect, offset, { ...{ x: 0, y: 0, z: 0, w: 1 }, ...props.spatialStyle?.rotation })

                await setViewport(windowInstance, elWidth, ins.window)

                // Note: should not use el.clientWidth which may ignore decimal, like 102.3 will be 102
                const computedStyle = getComputedStyle(targetStandardNode!);
                const width = computedStyle.width.endsWith('px') ? parseFloat(computedStyle.width) : 0
                const height = computedStyle.height.endsWith('px') ? parseFloat(computedStyle.height) : 0

                setElWidth(width)
                setElHeight(height)
            }
        }

        const spatialStyle = useSpatialContentStyle(getTargetStandardNode, resizeSpatial);

        // Sync prop updates
        useEffect(() => {
            (async () => {
                var ins = windowInstance.getActiveInstance()?.mnger
                if (ins) {
                    await ins.webview?.setStyle({
                        transparentEffect: props.spatialStyle?.transparentEffect === undefined ? true : props.spatialStyle?.transparentEffect,
                        glassEffect: props.spatialStyle?.glassEffect === undefined ? false : props.spatialStyle?.glassEffect,
                        cornerRadius: props.spatialStyle?.cornerRadius === undefined ? 0 : props.spatialStyle?.cornerRadius,
                        materialThickness: props.spatialStyle?.materialThickness === undefined ? "none" : props.spatialStyle?.materialThickness
                    })

                    await ins.webview?.setScrollEnabled(getAllowScroll())
                    await ins.webview?.setScrollWithParent(!getIsFixed())
                }
            })();

            resizeSpatial()
        }, [props.spatialStyle, props.allowScroll, props.scrollWithParent])

        // Trigger native resize on web resize events
        useEffect(() => {
            let ro = new ResizeObserver((elements) => {
                resizeSpatial()
            })
            const targetStandardNode = getTargetStandardNode()
            ro.observe(targetStandardNode!)
            window.addEventListener("resize", resizeSpatial);
            return () => {
                window.removeEventListener("resize", resizeSpatial);
                ro.disconnect()
            }
        }, [])

        const renderStandardInstance = () => (
            <El ref={childrenSizeRef}  {...otherProps} className={props.className} style={{ ...props.style, ...{ visibility: props.disableSpatial ? "visible" : "hidden" } }}  >
                {props.children}
            </El>
        );
        const renderWrappedStandardInstance = () => (
            <div ref={childrenSizeRef} style={{ visibility: props.disableSpatial ? "visible" : "hidden" }} >
                <El className={props.className} {...otherProps} style={{ ...props.style }}  >
                    {props.children}
                </El>
            </div>
        );

        const nodeToCopyStyleFrom = getTargetStandardNode() as HTMLElement

        return <>
            <SpatialReactComponentContext.Provider value={windowInstance.getActiveInstance()?.mnger || null}>
                <SpatialIsStandardInstanceContext.Provider value={true}>
                    {
                        isPrimitiveEl
                            ? renderStandardInstance()
                            : renderWrappedStandardInstance()
                    }
                </SpatialIsStandardInstanceContext.Provider>

                {!isCustomElement && portalEl && (isStandard !== true) ? <>
                    {createPortal(<El {...otherProps} className={props.className} style={{ ...getInheritedStyleProps(nodeToCopyStyleFrom), ...props.style, ...{ visibility: props.disableSpatial ? "hidden" : "visible", width: "" + elWidth + "px", height: "" + elHeight + "px", position: "", top: "0px", left: "0px", margin: "0px", marginLeft: "0px", marginRight: "0px", marginTop: "0px", marginBottom: "0px", overflow: "" } }}>
                        {props.children}
                    </El>, portalEl)}
                </> : <></>}
            </SpatialReactComponentContext.Provider>
        </>
    }

})

SpatialReactComponent.displayName = 'SpatialReactComponent'
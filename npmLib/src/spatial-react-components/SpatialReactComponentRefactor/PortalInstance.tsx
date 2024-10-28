import React, { CSSProperties, useRef, ReactNode, useCallback, useEffect, Ref, useImperativeHandle, forwardRef, useState } from 'react'
import { createPortal } from 'react-dom';
import { usePortalContainer } from './usePortalContainer';
import { SpatialWindowManagerContext } from './SpatialWindowManagerContext';
import { SpatialWindowManager } from './SpatialWindowManager';
import { spatialStyleDef } from '../types';
import { getInheritedStyleProps } from './utils';

interface PortalInstanceProps {
    allowScroll?: boolean,
    scrollWithParent?: boolean,
    spatialStyle?: Partial<spatialStyleDef>,

    El: React.ElementType,
    isPrimitiveEl: boolean,
    isSelfClosingTags: boolean,
    children: ReactNode,
    style?: CSSProperties | undefined,

    // for debug
    debugName?: string,
}

function renderJSXPortalInstance(inProps: PortalInstanceProps, elWidth: number, elHeight: number, inheritedPortalStyle: CSSProperties) {
    const { El, isPrimitiveEl, isSelfClosingTags, children, debugName, ...props } = inProps;
    const extraStyle = { position: "", top: "0px", left: "0px", margin: "0px", marginLeft: "0px", marginRight: "0px", marginTop: "0px", marginBottom: "0px", overflow: "" };
    const elWHStyle = {
        width: `${elWidth}px`,
        height: `${elHeight}px`,
    }
    const style = { ...inheritedPortalStyle, ...extraStyle, ...elWHStyle }

    if (isSelfClosingTags) {
        return <El style={style} {...props} />
    } else {
        return <El style={style} {...props} > {children} </El>
    }
}

function setOpenWindowStyle(openedWindow: Window) {
    openedWindow!.document.documentElement.style.backgroundColor = "transparent"
    openedWindow!.document.documentElement.style.cssText += document.documentElement.style.cssText
    openedWindow!.document.body.style.margin = "0px"
}

function handleOpenWindowDocumentClick(openedWindow: Window) {
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
}

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

function syncHeaderStyle(openedWindow: Window) {
    // Synchronize head of parent page to this page to ensure styles are in sync
    syncParentHeadToChild(openedWindow)

    const headObserver = new MutationObserver((mutations) => {
        syncParentHeadToChild(openedWindow)
        // setViewport(windowInstance, elWidth, openedWindow);
    })

    headObserver.observe(document.head, { childList: true, subtree: true, })

    return headObserver
}

function useSyncSpatialProps(spatialWindowManager: SpatialWindowManager | null, props: PortalInstanceProps) {
    // Sync prop updates
    useEffect(() => {
        async function asyncUpdateSpatialWindowComponent() {
            const webview = spatialWindowManager!.webview!;
            const scrollEnabled = props.allowScroll || (props.style?.overflow == "scroll")
            const scrollWithParent = (props.scrollWithParent == false) && (props.style?.position == "fixed")

            webview.setScrollEnabled(scrollEnabled)
            webview.setScrollWithParent(scrollWithParent)

            webview.setStyle({
                transparentEffect: props.spatialStyle?.transparentEffect === undefined ? true : props.spatialStyle?.transparentEffect,
                glassEffect: props.spatialStyle?.glassEffect === undefined ? false : props.spatialStyle?.glassEffect,
                cornerRadius: props.spatialStyle?.cornerRadius === undefined ? 0 : props.spatialStyle?.cornerRadius,
                materialThickness: props.spatialStyle?.materialThickness === undefined ? "none" : props.spatialStyle?.materialThickness
            })
        }

        if (spatialWindowManager?.webview) {
            asyncUpdateSpatialWindowComponent()
        }
    }, [spatialWindowManager,
        props.spatialStyle?.transparentEffect,
        props.spatialStyle?.glassEffect,
        props.spatialStyle?.cornerRadius,
        props.spatialStyle?.materialThickness,
        props.allowScroll,
        props.scrollWithParent])
}

async function setViewport(windowInstance: SpatialWindowManager, elWidth: number) {
    const bodyWidth = document.body.getBoundingClientRect().width;
    const viewport = windowInstance.window?.document.querySelector('meta[name="viewport"]')
    viewport?.setAttribute('content', `width=${bodyWidth}, initial-scale=1.0 user-scalable=no`)
    await windowInstance.webview?.setScrollEdgeInsets({ top: 0, left: 0, bottom: 0, right: elWidth - bodyWidth })
}



function useSyncDomRect(spatialWindowManager: SpatialWindowManager | null, spatialStyle: Partial<spatialStyleDef> | undefined) {
    const [elWidth, setElWidth] = useState(0)
    const [elHeight, setElHeight] = useState(0)
    const inheritedPortalStyleRef = useRef({})

    const syncDomRect = useCallback((dom: HTMLElement) => {
        async function asyncSyncDomRect() {
            let rect = dom.getBoundingClientRect()
            let offset = { ...{ x: 0, y: 0, z: 1 }, ...spatialStyle?.position };
            await spatialWindowManager?.resize(rect, offset, { ...{ x: 0, y: 0, z: 0, w: 1 }, ...spatialStyle?.rotation })

            // Note: should not use el.clientWidth which may ignore decimal, like 102.3 will be 102
            const computedStyle = getComputedStyle(dom);
            const width = computedStyle.width.endsWith('px') ? parseFloat(computedStyle.width) : 0;
            const height = computedStyle.height.endsWith('px') ? parseFloat(computedStyle.height) : 0;

            await setViewport(spatialWindowManager!, width);

            inheritedPortalStyleRef.current = getInheritedStyleProps(dom)

            setElWidth(width)
            setElHeight(height)
        }

        if (spatialWindowManager) {
            asyncSyncDomRect();
        }

    }, [spatialWindowManager]);

    return { syncDomRect, elWidth, elHeight, inheritedPortalStyle: inheritedPortalStyleRef.current }
}

export type PortalInstanceRef = Ref<{
    syncDomRect: (dom: HTMLElement) => void
}>

function PortalInstanceBase(inProps: PortalInstanceProps, ref: PortalInstanceRef) {
    const onContainerSpawned = useCallback(async (spatialWindowManager: SpatialWindowManager) => {
        const openWindow = spatialWindowManager.window!
        setOpenWindowStyle(openWindow)
        handleOpenWindowDocumentClick(openWindow)

        const headObserver = syncHeaderStyle(openWindow);
        const spawnedResult = {
            headObserver
        };

        return spawnedResult;
    }, []);

    const onContainerDestroyed = useCallback((spatialWindowManager: SpatialWindowManager, spawnedResult: any) => {
        const { headObserver } = spawnedResult;
        headObserver.disconnect();
    }, []);


    const [spatialWindowManager] = usePortalContainer({ onContainerSpawned, onContainerDestroyed });

    useSyncSpatialProps(spatialWindowManager, inProps);

    const { syncDomRect, elWidth, elHeight, inheritedPortalStyle } = useSyncDomRect(spatialWindowManager, inProps.spatialStyle);

    useImperativeHandle(ref, () => ({
        syncDomRect
    }));

    const JSXPortalInstance = renderJSXPortalInstance(inProps, elWidth, elHeight, inheritedPortalStyle);

    return (
        <SpatialWindowManagerContext.Provider value={spatialWindowManager}>
            {spatialWindowManager && spatialWindowManager.window && createPortal(JSXPortalInstance, spatialWindowManager.window.document.body)}
        </SpatialWindowManagerContext.Provider>
    );
}

export const PortalInstance = forwardRef(PortalInstanceBase)
PortalInstance.displayName = 'PortalInstance'

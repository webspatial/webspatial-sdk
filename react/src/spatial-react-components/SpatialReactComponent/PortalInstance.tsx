import React, { CSSProperties, useRef, ReactNode, useCallback, useEffect, Ref, useImperativeHandle, forwardRef, useState, useContext, useMemo, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom';
import { usePortalContainer } from './usePortalContainer';
import { SpatialWindowManagerContext } from './SpatialWindowManagerContext';
import { SpatialWindowManager } from './SpatialWindowManager';
import { RectType, spatialStyleDef, vecType } from '../types';
import { domRect2rectType, getInheritedStyleProps } from './utils';
import { SpatialReactContext } from './SpatialReactContext';
import { SpatialID } from './const';

interface PortalInstanceProps {
    allowScroll?: boolean,
    scrollWithParent?: boolean,
    spatialStyle?: Partial<spatialStyleDef>,

    El: React.ElementType,
    children?: ReactNode,
    style?: CSSProperties | undefined,

    [SpatialID]: string,
}

function renderJSXPortalInstance(inProps: Omit<PortalInstanceProps, 'allowScroll' | 'scrollWithParent' | 'spatialStyle' >, elWidth: number, elHeight: number, inheritedPortalStyle: CSSProperties) {
    const { El, style: inStyle = {}, ...props } = inProps;
    const extraStyle = { visibility: "visible", position: "", top: "0px", left: "0px", margin: "0px", marginLeft: "0px", marginRight: "0px", marginTop: "0px", marginBottom: "0px", overflow: "" };
    const elWHStyle = {
        width: `${elWidth}px`,
        height: `${elHeight}px`,
    }
    const style = { ...inStyle, ...inheritedPortalStyle, ...extraStyle, ...elWHStyle }

    return <El style={style} {...props} />
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
        syncParentHeadToChild(openedWindow);
    })

    headObserver.observe(document.head, { childList: true, subtree: true, })

    return headObserver
}

function useSyncSpatialProps(spatialWindowManager: SpatialWindowManager | undefined, props: Pick<PortalInstanceProps, 'style' | 'allowScroll' | 'scrollWithParent' | 'spatialStyle'>, domRect: RectType) {
    let { allowScroll, scrollWithParent, style, spatialStyle = {} } = props;
    let { position = { x: 0, y: 0, z: 1 }, rotation = { x: 0, y: 0, z: 0, w: 1 }, rotationAnchor = { x: 0.5, y: 0.5, z: 0 }, scale = { x: 1, y: 1, z: 1 }, glassEffect = false, transparentEffect = true, cornerRadius = 0, materialThickness = "none" } = spatialStyle;
    let stylePosition = style?.position
    let styleOverflow = style?.overflow

    // fill default values for position
    if (position.x === undefined) position.x = 0
    if (position.y === undefined) position.y = 0
    if (position.z === undefined) position.z = 1

    // fill default values for scale
    if (scale.x === undefined) scale.x = 1
    if (scale.y === undefined) scale.y = 1
    if (scale.z === undefined) scale.z = 1

    // fill default values for position
    if (rotationAnchor.x === undefined) rotationAnchor.x = 0.5
    if (rotationAnchor.y === undefined) rotationAnchor.y = 0.5
    if (rotationAnchor.z === undefined) rotationAnchor.z = 0

    // Sync prop updates
    useEffect(() => {
        if (spatialWindowManager && spatialWindowManager.webview) {
            const webview = spatialWindowManager.webview;
            (async function () {
                webview.setStyle({
                    transparentEffect,
                    glassEffect,
                    cornerRadius,
                    materialThickness
                })

            })()
        }
    }, [spatialWindowManager, transparentEffect, glassEffect, cornerRadius, materialThickness]);

    useEffect(() => {
        if (spatialWindowManager && spatialWindowManager.webview) {
            const webview = spatialWindowManager.webview;
            (async function () {
                webview.setScrollEnabled(allowScroll || (styleOverflow == "scroll"))

                const isFixed = scrollWithParent == false || (stylePosition == "fixed")
                webview.setScrollWithParent(!isFixed)
            })()
        }
    }, [spatialWindowManager, allowScroll, scrollWithParent, stylePosition, styleOverflow]);


    useEffect(() => {
        if (spatialWindowManager && domRect.width) {
            (async function () {
                // console.log('dbg syncSpatialProps for resize', domRect, position, rotation)

                await spatialWindowManager.resize(domRect, position as vecType, rotation, scale as vecType, rotationAnchor as vecType);
            })()
        }
    }, [spatialWindowManager, domRect, position, rotation, scale, rotationAnchor])

    useEffect(() => {
        // sync viewport
        if (spatialWindowManager?.window && spatialWindowManager.webview) {
            (async function () {
                const bodyWidth = document.body.getBoundingClientRect().width;
                const viewport = spatialWindowManager.window?.document.querySelector('meta[name="viewport"]')
                viewport?.setAttribute('content', `width=${bodyWidth}, initial-scale=1.0 user-scalable=no`)
                await spatialWindowManager.webview?.setScrollEdgeInsets({ top: 0, left: 0, bottom: 0, right: domRect.width - bodyWidth })
            })()

        }
    }, [spatialWindowManager, domRect.width])
}

function useSyncDomRect(spatialId: string) {
    const [domRect, setDomRect] = useState({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    });

    const inheritedPortalStyleRef = useRef({})

    const spatialReactContextObject = useContext(SpatialReactContext);

    useEffect(() => {
        const syncDomRect = () => {
            const dom = spatialReactContextObject?.querySpatialDom(spatialId);
            if (!dom) {
                return;
            }
            let domRect = dom.getBoundingClientRect();
            let rectType = domRect2rectType(domRect);
            const parentDom = spatialReactContextObject?.queryParentSpatialDom(spatialId);
            if (parentDom) {
                const parentDomRect = parentDom.getBoundingClientRect();
                const parentRectType = domRect2rectType(parentDomRect);
                rectType.x -= parentRectType.x;
                rectType.y -= parentRectType.y;
            }

            inheritedPortalStyleRef.current = getInheritedStyleProps(dom);
            setDomRect(rectType);
        }

        spatialReactContextObject?.onDomChange(spatialId, syncDomRect)

        return () => {
            spatialReactContextObject?.offDomChange(spatialId)
        }
    }, []);



    return { domRect, inheritedPortalStyle: inheritedPortalStyleRef.current }
}



export function PortalInstance(inProps: PortalInstanceProps) {
    const { allowScroll, scrollWithParent, spatialStyle, ...props } = (inProps);
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


    const spatialId = props[SpatialID];

    const { domRect, inheritedPortalStyle } = useSyncDomRect(spatialId);

    useSyncSpatialProps(spatialWindowManager, { style: props.style, allowScroll, scrollWithParent, spatialStyle }, domRect);

    const JSXPortalInstance = renderJSXPortalInstance(props, domRect.width, domRect.height, inheritedPortalStyle);

    return (
        <SpatialWindowManagerContext.Provider value={spatialWindowManager}>
            {spatialWindowManager && spatialWindowManager.window && createPortal(JSXPortalInstance, spatialWindowManager.window.document.body)}
        </SpatialWindowManagerContext.Provider>
    );
}

PortalInstance.displayName = 'PortalInstance'

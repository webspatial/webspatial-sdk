import React, { CSSProperties, useRef, ReactNode, useLayoutEffect, useEffect, useContext } from 'react'
import { useForceUpdate } from './useForceUpdate';
import { SpatialIsStandardInstanceContext } from './SpatialIsStandardInstanceContext';
import { SpatialReactContext } from './SpatialReactContext';
 
function useDetectDomRectChange() {
    const ref = useRef<HTMLDivElement>(null);

    const forceUpdate = useForceUpdate()

    const spatialReactContextObject = useContext(SpatialReactContext);

    useLayoutEffect(() => {
        ref.current && spatialReactContextObject?.notifyDomChange(ref.current)
    })

    // detect dom resize
    // Trigger native resize on web resize events
    useEffect(() => {
        if (!ref.current) {
            console.warn('Ref is not attached to the DOM');
            return;
        }
        
        let ro = new ResizeObserver((elements) => {
            forceUpdate()
        })

        ro.observe(ref.current!)
        return () => {
            ro.disconnect()
        }
    }, [])

    return ref;
}

interface StandardInstanceProps {
    El: React.ElementType,
    isSelfClosingTags: boolean,
    children: ReactNode,
    style?: CSSProperties | undefined,

    // for debug
    debugShowStandardInstance?: boolean,
}
export function StandardInstance(inProps: StandardInstanceProps) {
    const { El, isSelfClosingTags, children, style: inStyle, debugShowStandardInstance, ...props } = inProps;
    const extraStyle = { visibility: debugShowStandardInstance ? "visible" : "hidden" };
    const style = { ...inStyle, ...extraStyle }

    const ref = useDetectDomRectChange();

    let JSXComponent;
    if (isSelfClosingTags) {
        JSXComponent = <El ref={ref} style={style} {...props} />
    } else {
        JSXComponent = <El ref={ref} style={style} {...props} > {children} </El>
    }

    return (<SpatialIsStandardInstanceContext.Provider value={true}>
        {JSXComponent}
    </SpatialIsStandardInstanceContext.Provider>)
}

StandardInstance.displayName = 'StandardInstance'
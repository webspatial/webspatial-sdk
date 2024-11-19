import { ReactNode, CSSProperties, Ref, useRef, useCallback, useImperativeHandle, forwardRef, useMemo, ElementType } from 'react';
import { spatialStyleDef } from '../types'
import { getSession } from '../../utils';
import { StandardInstance } from './StandardInstance'
import { PortalInstance } from './PortalInstance'
import { SpatialReactContext, SpatialReactContextObject } from './SpatialReactContext';
import React from 'react';

export interface SpatialReactComponentProps {
    allowScroll?: boolean,
    scrollWithParent?: boolean,
    spatialStyle?: Partial<spatialStyleDef>,
    children?: ReactNode,
    className?: string,
    style?: CSSProperties | undefined

    component?: ElementType;

    debugName?: string,
    debugShowStandardInstance?: boolean
}

function parseProps(inProps: SpatialReactComponentProps) {
    const { debugShowStandardInstance, debugName = '', component, allowScroll, spatialStyle, scrollWithParent, ...props } = inProps;

    const El = component ? component : 'div';

    const componentDesc = { El }
    const spatialDesc = { spatialStyle, allowScroll, scrollWithParent }
    const debugDesc = { debugShowStandardInstance, debugName }
    return { componentDesc, spatialDesc, debugDesc, props }
}

function renderWebReactComponent(inProps: SpatialReactComponentProps) {
    const { componentDesc, props } = parseProps(inProps);
    const { El } = componentDesc;

    return <El {...props} />
}


function renderSpatialReactComponent(inProps: SpatialReactComponentProps) {
    // console.log('dbg renderSpatialReactComponent', inProps)
    const { componentDesc, spatialDesc, debugDesc, props } = parseProps(inProps);

    const standardInstanceProps = { ...props, ...componentDesc, debugShowStandardInstance: debugDesc.debugShowStandardInstance };

    const portalInstanceProps = { ...props, ...componentDesc, ...spatialDesc };

    const spatialReactContextObject = useMemo(() => new SpatialReactContextObject(debugDesc.debugName), [])

    return (
        <SpatialReactContext.Provider value={spatialReactContextObject}>
            <StandardInstance {...standardInstanceProps} />
            <PortalInstance {...portalInstanceProps} />
        </SpatialReactContext.Provider>)

}

export type SpatialReactComponentRef = Ref<{
    getBoundingClientRect: () => DOMRect
}>

function SpatialReactComponentRefactor(props: SpatialReactComponentProps, ref: SpatialReactComponentRef) {
    useImperativeHandle(ref, () => ({
        getBoundingClientRect() {
            return new DOMRect(0, 0, 0, 0);
        }
    }));

    const isWebSpatialEnv = getSession() !== null
    if (!isWebSpatialEnv) {
        return renderWebReactComponent(props)
    } else {
        return renderSpatialReactComponent(props)
    }
}

export const SpatialReactComponent = forwardRef(SpatialReactComponentRefactor)

SpatialReactComponent.displayName = 'SpatialReactComponent'

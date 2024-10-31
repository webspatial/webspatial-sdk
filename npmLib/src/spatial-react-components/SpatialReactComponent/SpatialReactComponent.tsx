import { ReactNode, CSSProperties, Ref, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { spatialStyleDef } from '../types'
import { getSession } from '../../utils';
import { SelfClosingTags } from "../primitives";
import {StandardInstance } from './StandardInstance'
import {PortalInstance, PortalInstanceRef } from './PortalInstance'

export interface SpatialReactComponentProps {
    allowScroll?: boolean,
    scrollWithParent?: boolean,
    spatialStyle?: Partial<spatialStyleDef>,
    children?: ReactNode,
    className?: string,
    style?: CSSProperties | undefined

    component?: React.ElementType;

    debugName?: string,
    debugShowStandardInstance?: boolean
}

function parseProps(inProps: SpatialReactComponentProps) {
    const { debugShowStandardInstance, debugName, component, allowScroll, spatialStyle, scrollWithParent, children, ...props } = inProps;

    const El = component ? component : 'div';
    const isPrimitiveEl = typeof El === 'string';
    const isSelfClosingTags = isPrimitiveEl && SelfClosingTags.includes(component as string)

    const componentDesc = {El, isPrimitiveEl, isSelfClosingTags}
    const spatialDesc = {spatialStyle, allowScroll, scrollWithParent}
    const debugDesc = {debugShowStandardInstance, debugName}
    return {componentDesc, spatialDesc, debugDesc, children, props}
}

function renderWebReactComponent(inProps: SpatialReactComponentProps) {
    const {componentDesc, children, props} = parseProps(inProps);
    const {El, isPrimitiveEl, isSelfClosingTags } = componentDesc;

    if (isSelfClosingTags) {
        return <El {...props} /> 
    }
    if (isPrimitiveEl) {
        return <El {...props} > {children} </El>
    } else {
        // render div wrapped component
        return <div> <El {...props} > {children} </El> </div>
    }
}


function renderSpatialReactComponent(inProps: SpatialReactComponentProps) {
    // console.log('dbg renderSpatialReactComponent', inProps)
    const {componentDesc, spatialDesc, debugDesc, children, props} = parseProps(inProps);
    const portalInstanceRef: PortalInstanceRef = useRef(null);
    const onStandardDomChange = useCallback((dom: HTMLElement) => {
        portalInstanceRef.current?.syncDomRect(dom);
    }, []);

    const standardInstanceProps = {children, ...props, ...componentDesc, debugShowStandardInstance: debugDesc.debugShowStandardInstance, onDomRectChange: onStandardDomChange} ;

    const portalInstanceProps = {children, ...props, ...componentDesc, ...spatialDesc, debugName: debugDesc.debugName} ;

    return (
    <>
        <StandardInstance {...standardInstanceProps} /> 
        <PortalInstance ref={portalInstanceRef} {...portalInstanceProps} />
    </>)

}

export type SpatialReactComponentRef = Ref<{
    getBoundingClientRect: () => DOMRect
}>

function SpatialReactComponentRefactor(props: SpatialReactComponentProps, ref: SpatialReactComponentRef) {
    useImperativeHandle(ref, () => ({
        getBoundingClientRect() {
            return new DOMRect(0,0,0,0);
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

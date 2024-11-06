import { forwardRef, Ref } from 'react';
import { useSpatialStyle } from './useSpatialStyle';
import { primitives, SelfClosingTags } from '../primitives';
import { SpatialReactComponent, SpatialReactComponentProps } from '../SpatialReactComponent';
import { getSession } from '../../utils/getSession';

function renderWebReactComponent(inProps: SpatialReactComponentProps) {
    const {children, component: El = 'div', ...props} = (inProps);
    const isPrimitiveEl = typeof El === 'string';
    const isSelfClosingTags = isPrimitiveEl && SelfClosingTags.includes(El as string)
    if (isSelfClosingTags) {
        return <El {...props} /> 
    } else {
        return <El {...props} > {children} </El>
    }
}

export function CSSSpatialComponent(inProps: SpatialReactComponentProps) {
    const { style = {}, ...props } = inProps;
    const { ref, spatialStyle,  ready } = useSpatialStyle();
    const {debugName, ...otherSpatial} = spatialStyle

    const divRefStyle = {
        ...style,
        "visibility": "hidden",
    }

    const spatialDivStyle = {
        ...style,
        transform: 'none'
    }
    const El = inProps.component || 'div' 

    console.log('dbg spatialStyle', spatialStyle)

    const isWebSpatialEnv = getSession() !== null
    if (!isWebSpatialEnv) {
        return renderWebReactComponent(inProps);
    }

    return <>
        {ready && <SpatialReactComponent style={spatialDivStyle} {...props} spatialStyle={otherSpatial} debugName={debugName}/>}
        <El className={inProps.className} style={divRefStyle} ref={ref} />
    </>
}

const cachedWithCSSSpatialType = new Map();

export function withCSSSpatial(Component: React.ElementType) {
    if (cachedWithCSSSpatialType.has(Component)) {
        return cachedWithCSSSpatialType.get(Component);
    } else {
        const WithCSSSpatialComponent = forwardRef((givenProps: any, givenRef: Ref<any>) => {
            const { component: ignoreComponent, ...props } = givenProps;
            return <CSSSpatialComponent component={Component} {...props} ref={givenRef} />
        })
        WithCSSSpatialComponent.displayName = `WithCSSSpatial(${typeof Component === 'string' ? Component : (Component.displayName || Component.name)})`

        cachedWithCSSSpatialType.set(Component, WithCSSSpatialComponent);
        return WithCSSSpatialComponent
    }
}

export const CSSSpatialPrimitive: Record<string, typeof CSSSpatialComponent> = {};

(function createSpatialPrimitive(CSSSpatialPrimitive) {
    primitives.forEach((primitive) => {
        CSSSpatialPrimitive[primitive] = withCSSSpatial(primitive);
    });
})(CSSSpatialPrimitive);

export const CSSSpatialDiv = CSSSpatialPrimitive.div;

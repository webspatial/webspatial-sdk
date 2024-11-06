import { forwardRef, Ref } from 'react';
import { useSpatialStyle } from './useSpatialStyle';
import { primitives } from '../primitives';
import { SpatialReactComponent, SpatialReactComponentProps } from '../SpatialReactComponent';

export function CSSSpatialComponent(inProps: SpatialReactComponentProps) {
    const { className = "", style = {}, component: El = 'div' } = inProps;
    const { ref, spatialStyle,  ready } = useSpatialStyle();
    const {debugName, ...otherSpatial} = spatialStyle

    const divRefStyle = {
        ...style,
        "visibility": "hidden",
    }

    return <>
        {ready && <SpatialReactComponent {...inProps} spatialStyle={otherSpatial} debugName={debugName}/>}
        <El className={className} style={divRefStyle} ref={ref} />
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

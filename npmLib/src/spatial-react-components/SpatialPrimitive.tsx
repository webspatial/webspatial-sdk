import { forwardRef, Ref } from "react";
import { SpatialReactComponent } from "./SpatialReactComponent";
import { primitives } from "./primitives";
import { debug } from "loglevel";


export function withSpatial(Component: any) {
    const WithSpatialComponent = forwardRef((givenProps: any, givenRef: Ref<any>) => {
        const { children, component: ignoreComponent, ...props } = givenProps;
        return <SpatialReactComponent component={Component} {...props} ref={givenRef} > {children} </SpatialReactComponent>
    })

    WithSpatialComponent.displayName = `WithSpatial(${typeof Component === 'string' ? Component : (Component.displayName || Component.name)})`
    return WithSpatialComponent
}

export const SpatialPrimitive: Record<string, typeof SpatialReactComponent> = {};

(function createSpatialPrimitive(SpatialPrimitive) {
    primitives.forEach((primitive) => {
        SpatialPrimitive[primitive] = withSpatial(primitive);
    });
})(SpatialPrimitive);

export const SpatialDiv = SpatialPrimitive.div;
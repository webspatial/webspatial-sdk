import { forwardRef, Ref } from "react";
import { SpatialReactComponent } from "./SpatialReactComponent";
import { primitives } from "./primitives";


export function withSpatial(Component: any) {
    return forwardRef ((givenProps: any, givenRef: Ref<any>) => {
        const {children, component: ignoreComponent, ...props} = givenProps;
        return <SpatialReactComponent component = {Component} {...props} ref={givenRef} > {children} </SpatialReactComponent>
    })
}

export const SpatialPrimitive: Record<string, typeof SpatialReactComponent> = {};

(function createSpatialPrimitive(SpatialPrimitive) {
    primitives.forEach((primitive) => {
        SpatialPrimitive[primitive] = withSpatial(primitive);
    });  
})(SpatialPrimitive);

export const SpatialDiv = SpatialPrimitive.div;
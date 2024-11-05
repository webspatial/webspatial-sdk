import { forwardRef, Ref } from "react";
import { primitives } from "./primitives";
import { SpatialReactComponent } from "./SpatialReactComponent";

const cachedWithSpatialType = new Map();

export function withSpatial(Component: React.ElementType) {
    if (cachedWithSpatialType.has(Component)) {
        return cachedWithSpatialType.get(Component);
    } else {
        const WithSpatialComponent = forwardRef((givenProps: any, givenRef: Ref<any>) => {
            const { component: ignoreComponent, ...props } = givenProps;
            return <SpatialReactComponent component={Component} {...props} ref={givenRef} />
        })
        WithSpatialComponent.displayName = `WithSpatial(${typeof Component === 'string' ? Component : (Component.displayName || Component.name)})`
        
        cachedWithSpatialType.set(Component, WithSpatialComponent);
        return WithSpatialComponent
    }
}

export const SpatialPrimitive: Record<string, typeof SpatialReactComponent> = {};

(function createSpatialPrimitive(SpatialPrimitive) {
    primitives.forEach((primitive) => {
        SpatialPrimitive[primitive] = withSpatial(primitive);
    });
})(SpatialPrimitive);

export const SpatialDiv = SpatialPrimitive.div;
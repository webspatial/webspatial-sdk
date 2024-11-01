import { forwardRef, Ref } from "react";
// import { SpatialReactComponent } from "./SpatialReactComponent";
import { primitives, SelfClosingTags } from "./primitives";
import { SpatialReactComponent } from "./SpatialReactComponent/SpatialReactComponent";

export function withSpatial(Component: any) {
    const WithSpatialComponent = forwardRef((givenProps: any, givenRef: Ref<any>) => {
        const { component: ignoreComponent, ...props } = givenProps;
        return <SpatialReactComponent component={Component} {...props} ref={givenRef} />
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
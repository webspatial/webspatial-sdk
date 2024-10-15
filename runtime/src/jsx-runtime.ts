"use strict";

import reactJSXRuntime from "react/jsx-runtime";
import { SpatialPrimitive, withSpatial } from "web-spatial";
import { initWebSpatialCSSSupportCapability } from "./initWebSpatialCSSSupportCapability";

initWebSpatialCSSSupportCapability();

const cachedWithSpatialType = new Map();

const specialFlag = "isspatial";

function replaceToSpatialPrimitiveType(type: React.ElementType, props: unknown) {
  const propsObject =  (props as Object)
  if (specialFlag in propsObject) {
    delete propsObject.isspatial;
    if (typeof type === "string" && SpatialPrimitive[type]) {
      type = SpatialPrimitive[type];
    } else if (cachedWithSpatialType.has(type)) {
      type = cachedWithSpatialType.get(type);
    } else {
      const oldType = type;
      type = withSpatial(type);
      cachedWithSpatialType.set(oldType, type);
    }
  }

  return type;
}

function jsxs(type: React.ElementType, props: unknown, key?: React.Key) {
  type = replaceToSpatialPrimitiveType(type, props);
  return reactJSXRuntime.jsxs(type, props, key);
}

function jsx(type: React.ElementType, props: unknown, key?: React.Key) {
  type = replaceToSpatialPrimitiveType(type, props);
  return reactJSXRuntime.jsx(type, props, key);
}

module.exports = {
  jsxs: jsxs,
  jsx: jsx,
  Fragment: reactJSXRuntime.Fragment,
};

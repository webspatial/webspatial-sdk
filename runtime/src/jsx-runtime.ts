"use strict";

import reactJSXRuntime from "react/jsx-runtime";
import { withCSSSpatial } from "web-spatial/private";

const specialFlag = "enable-xr";

function replaceToSpatialPrimitiveType(type: React.ElementType, props: unknown) {
  
  const propsObject =  (props as Object)
  if (specialFlag in propsObject) {
    delete propsObject[specialFlag];
    return withCSSSpatial(type);
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

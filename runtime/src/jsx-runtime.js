"use strict";

import { SpatialPrimitive, withSpatial } from "web-spatial";
// import { SpatialPrimitive, withSpatial } from "../../npmLib";

let originalExport = require("./react-jsx-runtime.development.js");

let i = 0;


const cachedWithSpatialType = new Map()

function replaceToSpatialPrimitiveType(type, props) {
  if (props.style?.back !== undefined) {
    const backValue = props.style?.back 
    delete props.style?.back;

    if (typeof type === "string" && SpatialPrimitive[type]) {
      type = SpatialPrimitive[type]
    } else {
      type = withSpatial(type)
    }

    props.spatialStyle = {position: {x: 0, y: 0, z: backValue}}
  } else {
    const specialFlag = 'isspatial';
    if (specialFlag in props) {
      delete props.isspatial;
      // to handle spatial
      // console.log('dbg type.componentStyle.rules', type.componentStyle.rules)
  
      if (typeof type === "string" && SpatialPrimitive[type]) {
        type = SpatialPrimitive[type]
      } else if (cachedWithSpatialType.has(type)){
        type = cachedWithSpatialType.get(type)
      } else {
        const oldType = type;
        type = withSpatial(type)
        cachedWithSpatialType.set(oldType, type)
      }
    }
  }

  return type;
}

function jsxs(type, props, key) {
  // i++;
  // console.log(i, "jsxs", props, type);
  type = replaceToSpatialPrimitiveType(type, props)

  return originalExport.jsxs(type, props, key);
}

function jsx(type, props, key) {
  // i++;
  // console.log(i, "jsx", props, type);
  type = replaceToSpatialPrimitiveType(type, props)
  return originalExport.jsx(type, props, key);
}

module.exports = {
  jsxs: jsxs,
  jsx: jsx,
  Fragment: originalExport.Fragment,
};

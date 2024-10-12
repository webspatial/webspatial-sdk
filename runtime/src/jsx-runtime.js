"use strict";

import { SpatialPrimitive, withSpatial } from "web-spatial";
import { initWebSpatialCSSSupportCapability } from "./initWebSpatialCSSSupportCapability.js";

let originalExport = require("./react-jsx-runtime.development.js");

initWebSpatialCSSSupportCapability();

const cachedWithSpatialType = new Map();

function replaceToSpatialPrimitiveType(type, props) {
  const specialFlag = "isspatial";
  if (specialFlag in props) {
    delete props.isspatial;
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

function jsxs(type, props, key) {
  type = replaceToSpatialPrimitiveType(type, props);
  return originalExport.jsxs(type, props, key);
}

function jsx(type, props, key) {
  type = replaceToSpatialPrimitiveType(type, props);
  return originalExport.jsx(type, props, key);
}

module.exports = {
  jsxs: jsxs,
  jsx: jsx,
  Fragment: originalExport.Fragment,
};


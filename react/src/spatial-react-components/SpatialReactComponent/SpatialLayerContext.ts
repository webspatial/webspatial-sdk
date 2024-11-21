import { createContext } from "react";

// SpatialLayerContext is used to mark the spatial layer of the spatial div, which is used to help portal instance find the correct layer standard instance div.
export const SpatialLayerContext = createContext(0);
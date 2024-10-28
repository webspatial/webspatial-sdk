import { createContext } from "react";
import { SpatialWindowManager } from "./SpatialWindowManager";

export const SpatialWindowManagerContext = createContext(null as null | SpatialWindowManager);
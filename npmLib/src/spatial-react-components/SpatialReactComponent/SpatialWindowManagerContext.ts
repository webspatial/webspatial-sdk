import { createContext } from "react";
import { SpatialWindowManager } from "./SpatialWindowManager";

export const SpatialWindowManagerContext = createContext<SpatialWindowManager | undefined>(undefined);
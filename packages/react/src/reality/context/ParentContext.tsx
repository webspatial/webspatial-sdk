import { SpatialEntity } from "@webspatial/core-sdk";
import { createContext, useContext } from "react";

export const ParentContext = createContext<SpatialEntity | null>(null)
export const useParentContext = () => useContext(ParentContext)

import { SpatialSceneCreationOptions, SpatialSceneType } from "./types";


export type SpatialSceneCreationOptionsInternal = SpatialSceneCreationOptions & {
  type: SpatialSceneType;
};

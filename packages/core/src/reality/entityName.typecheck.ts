import { createSpatialEntity, createSpatialModelEntity } from './realityCreator'

void createSpatialEntity({ name: 'validName' })
void createSpatialEntity({ name: 'valid_name' })

// @ts-expect-error Entity names must not include hyphens.
void createSpatialEntity({ name: 'invalid-name' })

const runtimeName: string = 'runtime-name'
void createSpatialEntity({ name: runtimeName })

void createSpatialModelEntity({ modelAssetId: 'model', name: 'validModel' })

// @ts-expect-error Model entity names must not include hyphens.
void createSpatialModelEntity({ modelAssetId: 'model', name: 'invalid-model' })

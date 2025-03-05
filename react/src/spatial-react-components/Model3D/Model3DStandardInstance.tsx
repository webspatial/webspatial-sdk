import { SpatialID } from '../SpatialReactComponent/const'
import { Model3DProps, ModelElementRef } from './types'

export function renderModel3DStandardInstance(
  spatialId: string,
  props: Model3DProps,
  refIn: ModelElementRef,
) {
  const { className, style } = props
  const extraProps = {
    [SpatialID]: spatialId,
  }

  return (
    <div
      data-model3d-spatialid={spatialId}
      className={className}
      style={style}
      ref={refIn}
      {...extraProps}
    />
  )
}

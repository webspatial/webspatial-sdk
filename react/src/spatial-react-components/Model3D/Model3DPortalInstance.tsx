import React, {
  CSSProperties,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react'
import { Model3DProps, ModelElement, ModelDragEvent, ModelEvent } from './types'
import { useSyncDomInfoFromStandardInstance } from './useSyncDomInfoFromStandardInstance'
import { useModel3DNative } from './useModel3DNative'
import { PopulatePartialSpatialTransformType } from './utils'
import { SpatialWindowManagerContext } from '../SpatialReactComponent/SpatialWindowManagerContext'
import { ModelDragEvent as SpatialModelDragEvent } from '@webspatial/core-sdk'

function useModelEvents(
  props: Model3DProps,
  modelRef: React.RefObject<ModelElement>,
) {
  const {
    onDragStart,
    onDrag,
    onDragEnd,

    onTap,
    onDoubleTap,
    onLongPress,
  } = props

  const onDragStartCb = useCallback(
    (spatialDragEvent: SpatialModelDragEvent) => {
      if (onDragStart) {
        const dragEvent: ModelDragEvent = {
          ...spatialDragEvent,
          target: modelRef.current! as ModelElement,
        }
        onDragStart(dragEvent)
      }
    },
    [onDragStart],
  )

  const onDragCb = useCallback(
    (spatialDragEvent: SpatialModelDragEvent) => {
      if (onDrag) {
        const dragEvent: ModelDragEvent = {
          ...spatialDragEvent,
          target: modelRef.current! as ModelElement,
        }
        onDrag(dragEvent)
      }
    },
    [onDrag],
  )

  const onDragEndCb = useCallback(
    (spatialDragEvent: SpatialModelDragEvent) => {
      if (onDragEnd) {
        const dragEvent: ModelDragEvent = {
          ...spatialDragEvent,
          target: modelRef.current! as ModelElement,
        }
        onDragEnd(dragEvent)
      }
    },
    [onDragEnd],
  )

  const onTapCb = useCallback(() => {
    if (onTap) {
      const event: ModelEvent = {
        target: modelRef.current! as ModelElement,
      }
      onTap(event)
    }
  }, [onTap])

  const onDoubleTapCb = useCallback(() => {
    if (onDoubleTap) {
      const event: ModelEvent = {
        target: modelRef.current! as ModelElement,
      }
      onDoubleTap(event)
    }
  }, [onDoubleTap])

  const onLongPressCb = useCallback(() => {
    if (onLongPress) {
      const event: ModelEvent = {
        target: modelRef.current! as ModelElement,
      }
      onLongPress(event)
    }
  }, [onLongPress])

  return {
    onDragStart: onDragStartCb,
    onDrag: onDragCb,
    onDragEnd: onDragEndCb,
    onTap: onTapCb,
    onDoubleTap: onDoubleTapCb,
    onLongPress: onLongPressCb,
  }
}

export function renderModel3DPortalInstance(
  spatialId: string,
  props: Model3DProps,
) {
  const {
    style: _,
    modelUrl,
    visible,
    spatialTransform,
    contentMode = 'fit',
    resizable = true,
    aspectRatio = 0,
    onLoad,

    children,
  } = props

  const theSpatialTransform = useMemo(() => {
    return PopulatePartialSpatialTransformType(spatialTransform)
  }, [spatialTransform])

  const {
    modelRef,
    domRect,
    inheritedPortalStyle,
    anchor,
    opacity,
    className,
  } = useSyncDomInfoFromStandardInstance(spatialId)

  const parentSpatialWindowManager = useContext(SpatialWindowManagerContext)

  const eventHandlers = useModelEvents(
    props,
    modelRef as React.RefObject<ModelElement>,
  )

  const { model3DNativeRef, phase, failureReason } = useModel3DNative(
    modelUrl,
    parentSpatialWindowManager!.entity!,
    eventHandlers,
  )

  // handle rect and transform
  useEffect(() => {
    if (model3DNativeRef.current) {
      model3DNativeRef.current.updateRectAndTransform(
        domRect,
        theSpatialTransform,
      )
    }
  }, [model3DNativeRef.current, domRect, theSpatialTransform])

  // handle anchor
  useEffect(() => {
    if (model3DNativeRef.current) {
      model3DNativeRef.current.setRotationAnchor(anchor)
    }
  }, [model3DNativeRef.current, anchor])

  // handle visible
  useEffect(() => {
    if (model3DNativeRef.current) {
      model3DNativeRef.current.setVisible(visible)
    }
  }, [model3DNativeRef.current, visible])

  // handle currentMode
  useEffect(() => {
    if (model3DNativeRef.current) {
      model3DNativeRef.current.setContentMode(contentMode)
    }
  }, [model3DNativeRef.current, contentMode])

  // handle resizable
  useEffect(() => {
    if (model3DNativeRef.current) {
      model3DNativeRef.current.setResizable(resizable)
    }
  }, [model3DNativeRef.current, resizable])

  // handle aspectRatio
  useEffect(() => {
    if (model3DNativeRef.current) {
      model3DNativeRef.current.setAspectRatio(aspectRatio)
    }
  }, [model3DNativeRef.current, aspectRatio])

  // handle opacity
  useEffect(() => {
    if (model3DNativeRef.current) {
      model3DNativeRef.current.setOpacity(opacity)
    }
  }, [model3DNativeRef.current, opacity])

  // handle onLoad using onSuccess/onFailure
  const onSuccess = useCallback(() => {
    ;(modelRef.current! as ModelElement).ready = true
    if (onLoad) {
      onLoad({
        target: modelRef.current! as ModelElement,
      })
    }
  }, [onLoad])

  const onFailure = useCallback(
    (_: string) => {
      const modelElement = modelRef.current! as ModelElement
      modelElement.ready = false
      if (onLoad) {
        onLoad({
          target: modelRef.current! as ModelElement,
        })
      }
    },
    [onLoad],
  )

  useEffect(() => {
    if (phase === 'failure') {
      onFailure(failureReason)
    } else if (phase === 'success') {
      onSuccess()
    }
  }, [phase])

  // handle modelUrl change, need to reset ready/currentSrc
  useEffect(() => {
    return () => {
      const modelElement = modelRef.current! as ModelElement
      if (modelElement) {
        modelElement.ready = false
        modelElement.currentSrc = modelUrl
      }
    }
  }, [modelUrl])

  const needRenderPlaceHolder = inheritedPortalStyle.position !== 'absolute'

  if (!needRenderPlaceHolder && phase !== 'failure') {
    return <></>
  } else {
    const extraStyle: CSSProperties = {
      visibility: 'visible',
      top: '0px',
      left: '0px',
      margin: '0px',
      marginLeft: '0px',
      marginRight: '0px',
      marginTop: '0px',
      marginBottom: '0px',
      borderRadius: '0px',
      overflow: '',
      width: `${domRect.width}px`,
      height: `${domRect.height}px`,
    }

    const style: CSSProperties = {
      ...inheritedPortalStyle,
      ...extraStyle,
    }

    return (
      <div
        data-model3d-spatialid={spatialId}
        className={className}
        style={style}
      >
        {phase === 'failure' && children}
      </div>
    )
  }
}

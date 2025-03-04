import React, {
  CSSProperties,
  forwardRef,
  Children,
  ReactElement,
  useMemo,
  ReactNode,
  useRef,
  useEffect,
} from 'react'

import { getSession } from '../../utils'
import {
  CSSModel3D,
  ModelElementRef,
  ModelEvent,
  ModelDragEvent,
  ModelElement,
} from '../Model3D'
import { getAbsoluteURL } from '../Model3D/utils'

import '@google/model-viewer'
import { ModelViewerElement } from '@google/model-viewer'

type ModelChildren =
  | React.ReactElement<{ type: string; src: string }>
  | [React.ReactElement<{ type: string; src: string }>, React.ReactElement]
  | React.ReactElement<{ type: string; src: string }>[]

export interface ModelProps {
  // common for config Model3D and ModelViewer
  className?: string
  style?: CSSProperties | undefined
  children: ModelChildren
  onLoad?: (event: ModelEvent) => void

  // for config Model3D only
  contentMode?: 'fill' | 'fit'
  resizable?: boolean
  aspectRatio?: number
  onDragStart?: (dragEvent: ModelDragEvent) => void
  onDrag?: (dragEvent: ModelDragEvent) => void
  onDragEnd?: (dragEvent: ModelDragEvent) => void

  onTap?: (event: ModelEvent) => void
  onDoubleTap?: (event: ModelEvent) => void
  onLongPress?: (event: ModelEvent) => void

  // for config ModelViewer only
  poster?: string
}

function renderInModel3D(
  inProps: Omit<ModelProps, 'children'>,
  ref: ModelElementRef,
  modelUrl: string,
  placeHolder: ReactNode,
) {
  const { poster, ...props } = inProps
  return (
    <CSSModel3D modelUrl={modelUrl} {...props} ref={ref}>
      {' '}
      {placeHolder}{' '}
    </CSSModel3D>
  )
}

function parseChildren(child: ModelChildren) {
  if (child === undefined) {
    throw new Error('children with <source> required  ')
  }

  const children = Children.toArray(child)

  const sourceElements = children.filter(
    node => (node as ReactElement).type === 'source',
  )
  if (sourceElements.length === 0) {
    throw new Error('children with at least one <source> required  ')
  }

  const gltfSources = sourceElements.filter(node => {
    const type = (node as ReactElement).props?.type.trim()
    return (
      type.startsWith('model/gltf-binary') || type.startsWith('model/gltf+json')
    )
  })
  const usdzSources = sourceElements.filter(node =>
    (node as ReactElement).props?.type.trim().startsWith('model/vnd.usdz+zip'),
  )
  let lastChild = children[children.length - 1]
  const placeHolder =
    sourceElements.indexOf(lastChild) < 0 ? lastChild : undefined

  const gltfSourceURL =
    gltfSources.length > 0 && (gltfSources[0] as ReactElement).props?.src
  const usdzSourceURL =
    usdzSources.length > 0 && (usdzSources[0] as ReactElement).props?.src

  return {
    placeHolder,
    gltfSourceURL: getAbsoluteURL(gltfSourceURL),
    usdzSourceURL: getAbsoluteURL(usdzSourceURL),
  }
}

function ModelBase(inProps: ModelProps, ref: ModelElementRef) {
  const { children, ...props } = inProps
  const { placeHolder, gltfSourceURL, usdzSourceURL } = useMemo(
    () => parseChildren(children),
    [children],
  )
  const isWebEnv = !getSession()
  if (isWebEnv) {
    const myModelViewer = useRef<ModelViewerElement>(null)
    const { className, style = {}, ...props } = inProps

    useEffect(() => {
      myModelViewer.current!.addEventListener('load', event => {
        if (props.onLoad) {
          props.onLoad({
            target: { ready: true, currentSrc: gltfSourceURL } as any,
          })
        }
      })

      myModelViewer.current!.addEventListener('pointerdown', event => {
        if (props.onDragStart) {
          props.onDragStart({
            eventType: 'dragstart',
            translation3D: { x: 0, y: 0, z: 0 },
            startLocation3D: { x: 0, y: 0, z: 0 },
            target: (ref as any).current as ModelElement,
          })
        }
      })

      myModelViewer.current!.addEventListener('pointermove', event => {
        if (props.onDrag) {
          props.onDrag({
            eventType: 'drag',
            translation3D: { x: 0, y: 0, z: 0 },
            startLocation3D: { x: 0, y: 0, z: 0 },
            target: (ref as any).current as ModelElement,
          })
        }
      })

      myModelViewer.current!.addEventListener('pointerup', event => {
        if (props.onDragEnd) {
          props.onDragEnd({
            eventType: 'dragend',
            translation3D: { x: 0, y: 0, z: 0 },
            startLocation3D: { x: 0, y: 0, z: 0 },
            target: (ref as any).current as ModelElement,
          })
        }
      })
    }, [])

    useEffect(() => {
      if (props.contentMode !== undefined && props.contentMode !== 'fit') {
        console.warn(
          "Model element contentMode != fit isn't supported on 2D screens",
        )
      }
      if (props.resizable !== undefined && props.resizable !== false) {
        console.warn(
          "Model element resizable != false isn't supported on 2D screens",
        )
      }
      if (props.aspectRatio !== undefined && props.aspectRatio !== 1) {
        console.warn(
          "Model element aspectRatio != 1 isn't supported on 2D screens",
        )
      }
    }, [props.contentMode, props.resizable, props.aspectRatio])

    return (
      <div ref={ref} className={className} style={style}>
        <model-viewer
          ref={myModelViewer}
          style={
            {
              width: '100%',
              height: '100%',
            } as any
          }
          src={gltfSourceURL}
          camera-controls
          touch-action="pan-y"
          poster={props.poster}
        />
      </div>
    )
  } else {
    return renderInModel3D(props, ref, usdzSourceURL, placeHolder)
  }
}

export const ModelNew = forwardRef(ModelBase)
ModelNew.displayName = 'Model'

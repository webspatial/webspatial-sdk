import React, {
  CSSProperties,
  forwardRef,
  Children,
  ReactElement,
  useMemo,
  ReactNode,
  useRef,
  useEffect,
  useState,
} from 'react'

import { getSession } from '../../utils'
import {
  CSSModel3D,
  ModelElementRef,
  ModelEvent,
  ModelDragEvent,
  ModelElement,
} from '../Model3D'
export type * from '../Model3D'
import { getAbsoluteURL } from '../Model3D/utils'

import { ModelViewerElement } from '@google/model-viewer'

{
  // Set a default size for the model tag
  // This is done with css to allow it to be overwritten by className/css/style props
  const styleElement = document.createElement('style')
  styleElement.id = '__custom-class-model-webspatial'
  styleElement.innerHTML = `.__custom-class-model-webspatial { width: 300px; height: 300px; }`
  if (document.getElementById('__custom-class-model-webspatial')) {
    console.warn('__custom-class-model-webspatial already exists')
  }
  document.head.prepend(styleElement)
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerElement | { ref: any }
    }
  }
}

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
    const source = (node as ReactElement).props?.src.trim().toLowerCase()
    const isGLFT = source.endsWith('.gltf')
    const isGLB = source.endsWith('.glb')

    return (
      (type.startsWith('model/gltf-binary') && isGLB) ||
      (type.startsWith('model/gltf+json') && isGLFT)
    )
  })
  const usdzSources = sourceElements.filter(node =>
    (node as ReactElement).props?.type.trim().startsWith('model/vnd.usdz+zip'),
  )
  let lastChild = children[children.length - 1]
  const placeHolder =
    sourceElements.indexOf(lastChild) < 0 ? lastChild : undefined

  const gltfSourceURL =
    gltfSources.length > 0 ? (gltfSources[0] as ReactElement).props?.src : ''
  const usdzSourceURL =
    usdzSources.length > 0 ? (usdzSources[0] as ReactElement).props?.src : ''

  return {
    placeHolder,
    gltfSourceURL: getAbsoluteURL(gltfSourceURL),
    usdzSourceURL: getAbsoluteURL(usdzSourceURL),
  }
}

function ModelBase(inProps: ModelProps, ref: ModelElementRef) {
  const { children, ...props } = inProps
  // Set default dimensions with predefined class
  props.className =
    '__custom-class-model-webspatial ' +
    (props.className ? props.className : '')
  let className = props.className

  const { placeHolder, gltfSourceURL, usdzSourceURL } = useMemo(
    () => parseChildren(children),
    [children],
  )
  const isWebEnv = !getSession()
  if (isWebEnv) {
    const [loadFailed, setLoadFailed] = useState(false)
    useEffect(() => {
      if (gltfSourceURL == '') {
        console.warn('Unable to display model, no gltf/glb source provided')
        if (props.onLoad) {
          props.onLoad({
            target: { ready: false, currentSrc: gltfSourceURL } as any,
          })
        }
        setLoadFailed(true)
      }
    }, [])

    const myModelViewer = useRef<ModelViewerElement>(null)
    const { style = {}, ...props } = inProps

    const isDragging = useRef(false)
    let [modelViewerExists, setModelViewerExists] = useState(false)
    useEffect(() => {
      var modelViewerFound = false
      customElements.whenDefined('model-viewer').then(function () {
        modelViewerFound = true
        setModelViewerExists(modelViewerFound)
      })

      // if model-viewer element is not loaded in 500ms, print a warning
      setTimeout(() => {
        if (!modelViewerFound) {
          console.warn(
            'model-viewer element not loaded yet, if you want to fallback to webGL model loading, you must include the model-viewer library manually in your html file eg. \n\n <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"></script>',
          )
          if (props.onLoad) {
            props.onLoad({
              target: { ready: false, currentSrc: gltfSourceURL } as any,
            })
          }
          setLoadFailed(true)
        }
      }, 500)
    }, [])

    useEffect(() => {
      if (!modelViewerExists) {
        return
      }

      myModelViewer.current!.addEventListener('error', event => {
        if ((event as any).detail.type == 'loadfailure') {
          if (props.onLoad) {
            props.onLoad({
              target: { ready: false, currentSrc: gltfSourceURL } as any,
            })
          }
          setLoadFailed(true)
        }
      })

      myModelViewer.current!.addEventListener('load', event => {
        if (props.onLoad) {
          props.onLoad({
            target: { ready: true, currentSrc: gltfSourceURL } as any,
          })
        }
        setLoadFailed(false)
      })

      myModelViewer.current!.addEventListener('pointerdown', event => {
        isDragging.current = true
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
        if (!isDragging.current) {
          return
        }
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
        if (!isDragging.current) {
          return
        }
        isDragging.current = false
        if (props.onDragEnd) {
          props.onDragEnd({
            eventType: 'dragend',
            translation3D: { x: 0, y: 0, z: 0 },
            startLocation3D: { x: 0, y: 0, z: 0 },
            target: (ref as any).current as ModelElement,
          })
        }
      })
    }, [modelViewerExists])

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
        {modelViewerExists ? (
          <>
            <model-viewer
              ref={myModelViewer}
              style={
                {
                  display: loadFailed ? 'none' : '',
                  width: '100%',
                  height: '100%',
                } as any
              }
              src={gltfSourceURL}
              camera-controls
              touch-action="pan-y"
              poster={props.poster}
            ></model-viewer>
            {loadFailed ? <>{placeHolder}</> : <> </>}
          </>
        ) : (
          <>
            {props.poster ? (
              <img
                className={className}
                style={Object.assign(structuredClone(style), {
                  objectFit: 'contain',
                })}
                src={props.poster}
              ></img>
            ) : (
              <>{placeHolder}</>
            )}
          </>
        )}
      </div>
    )
  } else {
    return renderInModel3D(props, ref, usdzSourceURL, placeHolder)
  }
}

export const Model = forwardRef(ModelBase)
Model.displayName = 'Model'

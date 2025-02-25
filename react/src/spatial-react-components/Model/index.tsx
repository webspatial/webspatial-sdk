import React, {
  CSSProperties,
  forwardRef,
  Children,
  ReactElement,
  useMemo,
  ReactNode,
} from 'react'

import { getSession } from '../../utils'
import {
  CSSModel3D,
  ModelElementRef,
  ModelEvent,
  ModelDragEvent,
} from '../Model3D'
import { getAbsoluteURL } from '../Model3D/utils'

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

function renderInModelViewer(
  props: Omit<ModelProps, 'children'>,
  ref: ModelElementRef,
  sourceURL: string,
  placeHolder: ReactNode,
) {
  // to impelement ModelViewer
  return <div ref={ref}> this is model component</div>
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
    return renderInModelViewer(props, ref, gltfSourceURL, placeHolder)
  } else {
    return renderInModel3D(props, ref, usdzSourceURL, placeHolder)
  }
}

export const ModelNew = forwardRef(ModelBase)
ModelNew.displayName = 'Model'

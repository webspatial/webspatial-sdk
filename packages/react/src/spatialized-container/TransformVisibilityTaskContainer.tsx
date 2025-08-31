import React, { CSSProperties } from 'react'
import { SpatialID } from './SpatialID'
import { createPortal } from 'react-dom'
import { useSpatialTransformVisibility } from './hooks/useSpatialTransformVisibility'

// used as root conntainer for all TransformVisibilityTaskContainer
const cssParserDivContainer = document.createElement('div')
cssParserDivContainer.style.position = 'absolute'
cssParserDivContainer.setAttribute('data-id', 'css-parser-div-container')

window.addEventListener('load', () => {
  document.body.appendChild(cssParserDivContainer)
})

interface TransformVisibilityTaskContainerProps {
  className?: string
  style?: CSSProperties
  [SpatialID]: string
}

// using css layout engine to calculate SpatializedContainer transform and visibility
export function TransformVisibilityTaskContainer(
  props: TransformVisibilityTaskContainerProps,
) {
  const { style: inStyle, ...restProps } = props
  const extraStyle: CSSProperties = {
    width: 0,
    height: 0,
    padding: 0,
    transition: 'none',
    position: 'absolute',
  }

  const style: CSSProperties = { ...inStyle, ...extraStyle }
  const ref = useSpatialTransformVisibility(props[SpatialID])

  return createPortal(
    <div ref={ref} style={style} {...restProps} />,
    cssParserDivContainer,
  )
}

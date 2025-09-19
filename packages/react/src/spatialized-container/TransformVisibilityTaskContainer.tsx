import React, {
  CSSProperties,
  ForwardedRef,
  forwardRef,
  useCallback,
  useRef,
} from 'react'
import { SpatialID } from './SpatialID'
import { createPortal } from 'react-dom'
import { useSpatialTransformVisibility } from './hooks/useSpatialTransformVisibility'

// used as root conntainer for all TransformVisibilityTaskContainer
const cssParserDivContainer = document.createElement('div')
cssParserDivContainer.style.position = 'absolute'
// cssParserDivContainer.style.width = '0px'
// cssParserDivContainer.style.overflow = 'hidden'

cssParserDivContainer.setAttribute('data-id', 'css-parser-div-container')

window.addEventListener('load', () => {
  document.body.appendChild(cssParserDivContainer)
})

function useInternalRef(ref: ForwardedRef<HTMLElement | null>) {
  const refInternal = useRef<HTMLElement | null>(null)
  const refInternalCallback = useCallback(
    (node: HTMLElement | null) => {
      refInternal.current = node

      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref],
  )

  return { refInternal, refInternalCallback }
}

interface TransformVisibilityTaskContainerProps {
  className?: string
  style?: CSSProperties
  [SpatialID]: string
}

// using css layout engine to calculate SpatializedContainer transform and visibility
export function TransformVisibilityTaskContainerBase(
  props: TransformVisibilityTaskContainerProps,
  ref: ForwardedRef<HTMLElement | null>,
) {
  const { style: inStyle, ...restProps } = props
  const extraStyle: CSSProperties = {
    // when width/height equal to zero, transform: translateX(-50%) won't work
    // to make sure the element is not visible, we set left/top to a very large negative value
    left: -10000,
    top: -10000,
    pointerEvents: 'none',
    opacity: 0,
    // width: 0,
    // height: 0,
    padding: 0,
    transition: 'none',
    position: 'absolute',
  }

  const { refInternal, refInternalCallback } = useInternalRef(ref)

  const style: CSSProperties = { ...inStyle, ...extraStyle }
  useSpatialTransformVisibility(props[SpatialID], refInternal)

  return createPortal(
    <div ref={refInternalCallback} style={style} {...restProps} />,
    cssParserDivContainer,
  )
}

export const TransformVisibilityTaskContainer = forwardRef(
  TransformVisibilityTaskContainerBase,
)

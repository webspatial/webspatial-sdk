import { RefObject, useCallback, useContext, useEffect, useRef } from 'react'
import { SpatialStyleInfoUpdateEvent } from '../../spatial-react-components/notifyUpdateStandInstanceLayout'
import { Matrix4, Vector3, Quaternion } from '../../utils/math'
import { SpatialCustomStyleVars, SpatialTransformVisibility } from '../types'
import { SpatializedContainerContext } from '../context/SpatializedContainerContext'

function parse2dMatrix(transformDataArray: number[]) {
  const [n11, n21, n12, n22, n13, n23] = transformDataArray
  const matrix4 = new Matrix4(
    n11,
    n12,
    0,
    n13,
    n21,
    n22,
    0,
    n23,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
  )
  return matrix4
}

function parse3dMatrix(transformDataArray: number[]) {
  const matrix4 = new Matrix4().fromArray(transformDataArray)
  return matrix4
}

function parseTransform(computedStyle: CSSStyleDeclaration) {
  let transform = computedStyle.getPropertyValue('transform')
  const matrixFlagString = 'matrix('
  const idxOfMatrix = transform.indexOf(matrixFlagString)
  if (idxOfMatrix !== -1) {
    const transformDataArray = transform
      .substring(matrixFlagString.length, transform.length - 1)
      .split(',')
      .map(item => parseFloat(item))
    return { transformExist: true, matrix: parse2dMatrix(transformDataArray) }
  } else {
    const matrix3dFlagString = 'matrix3d('
    const idxOfMatrix3d = transform.indexOf(matrix3dFlagString)
    if (idxOfMatrix3d !== -1) {
      const transform3dDataArray = transform
        .substring(matrix3dFlagString.length, transform.length - 1)
        .split(',')
        .map(item => parseFloat(item))
      return {
        transformExist: true,
        matrix: parse3dMatrix(transform3dDataArray),
      }
    } else {
      return { transformExist: false, matrix: new Matrix4() }
    }
  }
}

function parseBack(computedStyle: CSSStyleDeclaration) {
  let backProperty = computedStyle.getPropertyValue(SpatialCustomStyleVars.back)
  let back: number | undefined = undefined
  try {
    back = parseFloat(backProperty)
  } catch (error) {}
  return new Matrix4().makeTranslation(0, 0, back || 0)
}

function parseTransformAndVisibilityProperties(
  node: HTMLElement,
): SpatialTransformVisibility {
  const computedStyle = getComputedStyle(node)

  // handle back property
  const mat4ForBack = parseBack(computedStyle)

  // handle transform properties

  const { transformExist, matrix: mat4ForTransform } =
    parseTransform(computedStyle)

  const resultMatrix = new Matrix4()
  resultMatrix.multiplyMatrices(mat4ForBack, mat4ForTransform)

  // const position = new Vector3()
  // const quaternion = new Quaternion()
  // const scale = new Vector3()

  // resultMatrix.decompose(position, quaternion, scale)

  // parse visibility
  const visibility = computedStyle.getPropertyValue('visibility')

  return {
    visibility,
    transformMatrix: resultMatrix,
    transformExist,
  }
}

export function useSpatialTransformVisibility(
  spatialId: string,
  ref: RefObject<HTMLElement | null>,
) {
  const spatializedContainerObject = useContext(SpatializedContainerContext)!

  const checkSpatialStyleUpdate = useCallback(() => {
    const spatialTransformVisibility = parseTransformAndVisibilityProperties(
      ref.current!,
    )

    // notify SpatializedContainerContext
    spatializedContainerObject.updateSpatialTransformVisibility(
      spatialId,
      spatialTransformVisibility,
    )
  }, [])

  useEffect(() => {
    checkSpatialStyleUpdate()
  }, [checkSpatialStyleUpdate])

  useEffect(() => {
    // sync spatial style when this dom or sub dom change
    const observer = new MutationObserver(mutationsList => {
      checkSpatialStyleUpdate()
    })
    const config = {
      childList: false,
      subtree: false,
      attributes: true,
      // attributeOldValue: true,
      attributeFilter: ['style', 'class'],
    }
    observer.observe(ref.current!, config)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const headObserver = new MutationObserver(mutations => {
      checkSpatialStyleUpdate()
    })
    headObserver.observe(document.head, { childList: true, subtree: true })
    return () => {
      headObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    const onDomUpdated = (event: Event) => {
      checkSpatialStyleUpdate()
    }

    // check style property change when some external style change
    document.addEventListener(
      SpatialStyleInfoUpdateEvent.domUpdated,
      onDomUpdated,
    )

    return () => {
      document.removeEventListener(
        SpatialStyleInfoUpdateEvent.domUpdated,
        onDomUpdated,
      )
    }
  }, [])
}

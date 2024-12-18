import { useCallback, useEffect, useRef, useState } from 'react'
import { SpatialStyleInfoUpdateEvent } from '../notifyUpdateStandInstanceLayout'
import isEqual from 'lodash.isequal'
import { Matrix4, Vector3, Quaternion } from './math'
import { type BackgroundMaterialType } from '@xrsdk/runtime'
import { SpatialCustomVars } from './const'

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
    return parse2dMatrix(transformDataArray)
  } else {
    const matrix3dFlagString = 'matrix3d('
    const idxOfMatrix3d = transform.indexOf(matrix3dFlagString)
    if (idxOfMatrix3d !== -1) {
      const transform3dDataArray = transform
        .substring(matrix3dFlagString.length, transform.length - 1)
        .split(',')
        .map(item => parseFloat(item))
      return parse3dMatrix(transform3dDataArray)
    } else {
      return new Matrix4()
    }
  }
}

function parseBack(computedStyle: CSSStyleDeclaration) {
  let backProperty = computedStyle.getPropertyValue(SpatialCustomVars.back)
  let back: number | undefined = undefined
  try {
    back = parseFloat(backProperty)
  } catch (error) {}
  return new Matrix4().makeTranslation(0, 0, back || 1)
}

function parseSpatialStyle(node: HTMLElement) {
  const computedStyle = getComputedStyle(node)

  // handle back property
  const mat4ForBack = parseBack(computedStyle)

  // handle transform properties
  const mat4ForTransform = parseTransform(computedStyle)

  const resultMatrix = new Matrix4()
  resultMatrix.multiplyMatrices(mat4ForBack, mat4ForTransform)

  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()

  resultMatrix.decompose(position, quaternion, scale)

  // parse zIndex
  const zIndex = parseFloat(computedStyle.getPropertyValue('z-index'))

  // parse backgroundMaterialType
  const backgroundMaterialType: BackgroundMaterialType =
    computedStyle.getPropertyValue(
      SpatialCustomVars.backgroundMaterial,
    ) as BackgroundMaterialType

  return {
    position: { x: position.x, y: position.y, z: position.z },
    rotation: {
      x: quaternion.x,
      y: quaternion.y,
      z: quaternion.z,
      w: quaternion.w,
    },
    scale: { x: scale.x, y: scale.y, z: scale.z },
    zIndex,
    material: {
      type: backgroundMaterialType,
    },
  }
}

export function useSpatialStyle() {
  const ref = useRef<HTMLElement | null>(null)
  const [spatialStyle, setSpatialStyle] = useState({
    position: { x: 0, y: 0, z: 1 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
    zIndex: 0,
    material: {
      type: 'none' as BackgroundMaterialType,
    },
  })
  const [ready, setReady] = useState(false)

  const checkSpatialStyleUpdate = useCallback(() => {
    const nextSpatialStyle = parseSpatialStyle(ref.current!)
    if (!isEqual(spatialStyle, nextSpatialStyle)) {
      setSpatialStyle(nextSpatialStyle)
    }
  }, [])

  useEffect(() => {
    // first time update
    if (!ref.current) {
      return
    }

    const spatialStyle = parseSpatialStyle(ref.current!)
    setSpatialStyle(spatialStyle)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ref.current) {
      return
    }

    // sync spatial style when this dom or sub dom change
    const observer = new MutationObserver(mutationsList => {
      checkSpatialStyleUpdate()
    })
    const config = {
      childList: true,
      subtree: true,
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
    if (!ref.current) {
      return
    }

    // check style property change when some external node changed
    function isDescendant(child: Node, parent: Node) {
      if (child === parent) {
        return true
      }
      let node: Node | null = child
      while (node) {
        if (node === parent) {
          return true
        }
        node = node.parentElement
      }
      return false
    }

    const onDomUpdated = (event: Event) => {
      const mutationsList = (event as CustomEvent).detail as MutationRecord[]
      // spatialReactComponentDiv is hardcode currently, maybe refactor later (get from SpatialReactComponent)
      const spatialReactComponentDiv = (ref.current! as HTMLElement)
        .previousElementSibling!
      // ignore the mutation that is in the current ref dom or the previous sibling dom (Like SpatialReactComponent)
      const targets = mutationsList
        .map(m => m.target)
        .filter(
          node =>
            node !== ref.current! &&
            !isDescendant(node, spatialReactComponentDiv),
        )
      if (targets.length > 0) {
        checkSpatialStyleUpdate()
      }
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

  return { ref, ready, spatialStyle }
}

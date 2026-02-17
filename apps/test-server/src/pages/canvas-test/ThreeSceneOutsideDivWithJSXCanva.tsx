import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

function createScene(canvas: HTMLCanvasElement) {
  var renderer: THREE.WebGLRenderer

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    75,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000,
  )
  renderer = new THREE.WebGLRenderer({ canvas })
  renderer.setSize(canvas.clientWidth, canvas.clientHeight)

  console.log(
    'dbg ThreeScene useEffect containerRef',
    canvas,
    canvas.clientWidth,
    canvas.clientHeight,
  )

  const geometry = new THREE.BoxGeometry()
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  const cube = new THREE.Mesh(geometry, material)
  scene.add(cube)
  camera.position.z = 5

  const animate = () => {
    requestAnimationFrame(animate)
    cube.rotation.x += 0.01
    cube.rotation.y += 0.01
    renderer.render(scene, camera)
  }
  animate()

  return {
    scene,
    camera,
    renderer,
  }
}

function destroyScene(renderer: THREE.WebGLRenderer) {
  renderer.dispose()
}

const ThreeSceneOutsideDivWithCanvas = () => {
  const refCanvas = useRef(null)

  // useEffect(() => {
  //   const canvas = refCanvas.current as any

  //   const { renderer } = createScene(canvas)

  //   return () => {
  //     destroyScene(renderer)
  //   }
  // }, [])

  const readyRef = useRef(false)

  const ref = (spatialDivElement: HTMLDivElement | null) => {
    console.log('dbg ThreeSceneOutsideDiv ref', spatialDivElement)

    if (spatialDivElement) {
      readyRef.current = true
    }
  }

  const refInnerDiv = (spatialDivElement: HTMLDivElement | null) => {
    console.log('dbg ThreeSceneOutsideDiv refInnerDiv', spatialDivElement)
    if (readyRef.current && spatialDivElement) {
      const canvas = refCanvas.current as any

      // const { renderer } = createScene(canvas)
    }
  }

  return (
    <div
      enable-xr
      ref={ref}
      style={{
        marginTop: '100px',
        marginLeft: '10%',
        width: '80%',
        height: '100%',
        '--xr-background-material': 'translucent',
        '--xr-back': 300,
      }}
    >
      <canvas
        ref={refCanvas}
        width="500"
        height="500"
        style={{ width: '500px', height: '500px' }}
      />
      <div id="footer" ref={refInnerDiv}>
        {' '}
        footer{' '}
      </div>
    </div>
  )
}

export default ThreeSceneOutsideDivWithCanvas

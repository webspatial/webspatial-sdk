import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

function createScene(canvas: HTMLCanvasElement) {
  console.log('dbg createScene ', canvas)
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

const CanvasPop = () => {
  const refCanvas = useRef(null)

  // useEffect(() => {
  //   const canvas = refCanvas.current as any

  //   const { renderer } = createScene(canvas)

  //   return () => {
  //     destroyScene(renderer)
  //   }
  // }, [])

  const refCallback = (refCanvas: HTMLCanvasElement | null) => {
    console.log('dbg refCallback ', refCanvas)
    if (refCanvas) {
      const { renderer } = createScene(refCanvas)
    }
  }

  return (
    <canvas
      enable-xr
      style={{
        marginTop: '100px',
        marginLeft: '10%',
        width: '500px',
        height: '500px',
        '--xr-background-material': 'translucent',
        '--xr-back': 300,
      }}
      ref={refCallback}
      width="500"
      height="500"
    />
  )
}

export default CanvasPop

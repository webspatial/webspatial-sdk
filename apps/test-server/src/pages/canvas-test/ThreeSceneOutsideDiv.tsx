import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

function createScene(container: HTMLDivElement) {
  var renderer: THREE.WebGLRenderer

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000,
  )
  renderer = new THREE.WebGLRenderer()
  renderer.setSize(container.clientWidth, container.clientHeight)
  container.appendChild(renderer.domElement)

  console.log(
    'dbg ThreeScene useEffect containerRef',
    container,
    container.clientWidth,
    container.clientHeight,
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

function destroyScene(
  container: HTMLDivElement,
  renderer: THREE.WebGLRenderer,
) {
  container.removeChild(renderer.domElement)
  renderer.dispose()
}

const ThreeSceneOutsideDiv = () => {
  const containerRef = useRef(null)

  // useEffect(() => {
  //   const container = containerRef.current as any

  //   const { renderer } = createScene(container)

  //   return () => {
  //     destroyScene(container, renderer)
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
      const container = containerRef.current as any

      const { renderer } = createScene(container)
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
      <div ref={containerRef} style={{ width: '500px', height: '500px' }} />
      <div ref={refInnerDiv}> another div </div>
    </div>
  )
}

export default ThreeSceneOutsideDiv

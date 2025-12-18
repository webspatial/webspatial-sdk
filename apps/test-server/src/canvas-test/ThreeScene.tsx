import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

const ThreeScene = () => {
  const containerRef = useRef(null)

  useEffect(() => {
    var renderer: THREE.WebGLRenderer

    const container = containerRef.current as any

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
      containerRef.current,
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

    return () => {
      var container = containerRef.current as any

      container.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  return <div ref={containerRef} style={{ width: '500px', height: '500px' }} />
}

export default ThreeScene

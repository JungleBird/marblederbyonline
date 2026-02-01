import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { SceneEnvironment } from './SceneEnvironment'
import { ObstructionManager } from './ObstructionManager'

export default function CameraObstruction() {
  const mountRef = useRef(null)

  useEffect(() => {
    const container = mountRef.current

    // --- 1. Core Setup (Scene, Camera, Renderer) ---
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 2

    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)
    container.appendChild(renderer.domElement)

    // --- 2. World Setup ---
    const sceneMeshes = []
    SceneEnvironment(scene, sceneMeshes)

    // --- 3. Interaction Setup (Controls, Obstruction) ---
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    const obstructionManager = ObstructionManager(camera, sceneMeshes)
    const checkObstruction = () => obstructionManager.update(controls.target)
    
    controls.addEventListener('change', checkObstruction)

    // --- 4. Utils & Animation ---
    const stats = new Stats()
    container.appendChild(stats.dom)

    let animationId
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
      stats.update()
    }
    animate()

    // --- 7. Cleanup ---
    return () => {
      controls.removeEventListener('change', checkObstruction)
      cancelAnimationFrame(animationId)
      if (container) {
        container.innerHTML = '' // Clear container
      }
      renderer.dispose()
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />
}
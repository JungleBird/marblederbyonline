import React, { useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import soccerBallUrl from './scene.gltf?url'

export function SoccerBallModel({ radius = 0.6, scale, ...props }) {
  const { scene } = useGLTF(soccerBallUrl)
  const groupRef = useRef()
  const materialsRef = useRef([])

  const clone = useMemo(() => {
    const clonedScene = scene.clone(true)
    materialsRef.current = []

    // Update world matrices before measuring
    clonedScene.updateMatrixWorld(true)

    // Calculate bounding box to center and scale the model
    const bbox = new THREE.Box3().setFromObject(clonedScene)
    const center = bbox.getCenter(new THREE.Vector3())
    const size = bbox.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z) || 1
  
    clonedScene.traverse((child) => {
      // Remove any existing colliders or physics-related userData
      if (child.userData) {
        delete child.userData.collider
      }
      
      if (child.isMesh && child.material) {
        // Clone material to avoid affecting other instances
        child.material = child.material.clone()
        
        child.castShadow = true
        child.receiveShadow = true
        child.material.needsUpdate = true
        materialsRef.current.push(child.material)
      }
    })

    // Wrap in pivot group for centering
    const pivot = new THREE.Group()
    pivot.add(clonedScene)

    // Offset model so its center is at origin
    clonedScene.position.set(-center.x, -center.y, -center.z)

    // Calculate scale to make diameter match 2 * radius
    const autoScale = (radius * 2) / maxDim
    const finalScale = scale !== undefined ? scale : autoScale
    pivot.scale.setScalar(finalScale)
    
    return pivot
  }, [scene, radius, scale])

  return <primitive ref={groupRef} object={clone} {...props} />
}

useGLTF.preload(soccerBallUrl)

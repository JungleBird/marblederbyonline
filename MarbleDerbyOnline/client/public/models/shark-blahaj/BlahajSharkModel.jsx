import React, { useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import sharkUrl from './scene.gltf?url'

export function BlahajShark({ scale = 1, ...props }) {
  const { scene } = useGLTF(sharkUrl)
  const groupRef = useRef()
  const materialsRef = useRef([])

  const clone = useMemo(() => {
    const clonedScene = scene.clone()
    materialsRef.current = []
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        // Clone material to avoid affecting other instances
        child.material = child.material.clone()
        
        // "Shroud in darkness" settings
        child.material.emissiveIntensity = (props.emissivity !== undefined) ? props.emissivity : 0.1
        // Darken the texture/color but keep enough value to react to spotlights
        child.material.color.multiplyScalar(0.2) 
        child.material.roughness = 1 // Fully matte to catch light diffusely
        child.material.metalness = 0 // Non-metallic
        child.material.envMapIntensity = 0 // No environment reflections
        
        // Opacity settings
        child.material.transparent = true
        child.material.opacity = 1
        materialsRef.current.push(child.material)
        
        child.castShadow = true
        child.receiveShadow = true
        child.material.needsUpdate = true
      }
    })
    return clonedScene
  }, [scene])

  // Removed useFrame: movement logic should be handled by parent/controller
  
  return <primitive ref={groupRef} object={clone} scale={scale} {...props} />
}

useGLTF.preload(sharkUrl)

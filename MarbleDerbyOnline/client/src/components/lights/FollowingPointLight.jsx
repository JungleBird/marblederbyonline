import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function FollowingPointLight({
  targetRef,
  height = 4,
  distance = 30,
  color = '#ffffff',
  intensity = 1.5,
  castShadow = true,
}) {
  const lightRef = useRef()

  useFrame(() => {
    const target = targetRef.current
    const light = lightRef.current
    if (!target || !light) return

    const { x, z } = target.position
    light.position.set(x, height, z)
  })

  return (
    <pointLight
      ref={lightRef}
      color={color}
      intensity={intensity}
      distance={distance}
      castShadow={castShadow}
    />
  )
}

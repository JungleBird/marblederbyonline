import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function DramaticGroundSpotlight({
  targetRef,
  height = 8,
  groundY = -2,
  color = '#ffd27f',
  intensity = 4,
  angle = Math.PI / 5,
  penumbra = 0.6,
  distance = 30,
  castShadow = true,
  shadowMapSize = 2048,
  shadowBias = -0.0002,
  shadowNormalBias = 0.01,
}) {
  const lightRef = useRef()
  const targetObjRef = useRef(new THREE.Object3D())

  useFrame(() => {
    const tracked = targetRef.current
    const light = lightRef.current
    const targetObj = targetObjRef.current
    if (!tracked || !light || !targetObj) return

    const { x, z } = tracked.position

    // Position spotlight above the character
    light.position.set(x, height, z)

    // Aim at ground directly below character (creates dramatic downward cone)
    targetObj.position.set(x, groundY, z)
    targetObj.updateMatrixWorld()
    light.target = targetObj
  })

  return (
    <>
      <spotLight
        ref={lightRef}
        color={color}
        intensity={intensity}
        angle={angle}
        penumbra={penumbra}
        distance={distance}
        castShadow={castShadow}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-bias={shadowBias}
        shadow-normalBias={shadowNormalBias}
      />
      {/* Ensure the light's target is part of the scene graph */}
      <primitive object={targetObjRef.current} />
    </>
  )
}

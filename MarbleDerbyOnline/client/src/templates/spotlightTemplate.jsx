import * as THREE from 'three'
import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { SpotLight, OrbitControls, Environment } from '@react-three/drei'

function Scene() {
  return (
    <>



    </>
  )
}

export default function SpotlightTemplate() {
  const meshRef = useRef()
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
    <Canvas shadows camera={{ position: [5, 5, 10], fov: 50 }}>
      {/* Enable shadows in the Canvas component */}



      {/* Configure the spotlight using the SpotLight drei helper */}
      <SpotLight
        castShadow
        position={[5, 10, 0]}
        angle={0.3}
        penumbra={1} // Softens the edge of the light cone
        intensity={500} // Increased intensity for R155+ Three.js versions
        shadow-mapSize={[1024, 1024]} // Shadow map size for quality
        color="#ff00a0"
      />
      
      <ambientLight intensity={0.5} />
      {/* Sphere that casts a shadow */}
      <mesh ref={meshRef} castShadow position={[0, 2, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.2} />
      </mesh>


      {/* Ground plane that receives shadows */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#aaaaaa" />
      </mesh>

      <OrbitControls enableDamping dampingFactor={0.05} />
      <Environment preset="city" />
    </Canvas>
    </div>
  )
}
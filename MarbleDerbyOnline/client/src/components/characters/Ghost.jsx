import React, { useRef, forwardRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Text } from '@react-three/drei'
import * as THREE from 'three'

// Export GhostMesh for reuse in other components
export const GhostMesh = (props) => {
  return (
    <group {...props} receiveShadow castShadow>
      {/* Main ghost body - rounded top */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.6, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial 
          color="#f8f8f8" 
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      
      {/* Middle body section */}
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.6, 0.65, 0.6, 32]} />
        <meshStandardMaterial 
          color="#f8f8f8" 
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      
      {/* Left eye */}
      <mesh position={[-0.2, 0.35, 0.45]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Right eye */}
      <mesh position={[0.2, 0.35, 0.45]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Mouth - oval shape */}
      <mesh position={[0, 0.15, 0.52]} rotation={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Subtle glow effect */}
      <pointLight position={[0, 0.2, 0]} intensity={0.5} distance={2} color="#ffffff" />
    </group>
  )
}

function AnimatedGhost() {
  const meshRef = useRef()
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.1
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  return <GhostMesh ref={meshRef} />
}

// Main Ghost component
export function CardDisplay({ width = '100%', height = '300px' }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: "8px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <spotLight 
          position={[0, 3, 0]} 
          angle={0.5} 
          penumbra={1} 
          intensity={0.5}
          color="#8A4DFF"
        />
        
        <group position={[0, -0.3, 0]}>
          <AnimatedGhost />
        </group>
        
        <Environment preset="night" />
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          autoRotate
          autoRotateSpeed={2}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  )
}

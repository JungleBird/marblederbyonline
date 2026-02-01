import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  MeshDistortMaterial,
  Sparkles,
} from "@react-three/drei";
import * as THREE from "three";


const BALL_CONFIG = {
  radius: 0.6,
};
export function MarbleBallMesh({radius = BALL_CONFIG.radius, props}) {
  // Use a group reference for any internal animation if needed
  return (
    <group {...props} dispose={null}>
      {/* Outer Glass Shell */}
      <mesh castShadow receiveShadow renderOrder={2}>
        {/* Radius 0.6 to match other characters */}
        <sphereGeometry args={[radius, 64, 64]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={1.0} // Fully transparent glass
          opacity={1}
          roughness={0.05} // Very smooth
          thickness={2.0} // Refraction volume
          ior={1.6} // Index of refraction for glass
          clearcoat={1.0}
          clearcoatRoughness={0.0}
          envMapIntensity={1.5}
          depthWrite={false}
          transparent={true}
        />
      </mesh>

      {/* Inner Galaxy Core - Complex Swirling Layers */}
      {/* Layer 1: Deep Nebula Purple */}
      <mesh renderOrder={1}>
        <sphereGeometry args={[radius * 0.17, 10, 10]} />
        <MeshDistortMaterial
          color="#2a0066"
          emissive="#120033"
          emissiveIntensity={0.2}
          roughness={0.1}
          metalness={0.8}
          distort={0.4}
          speed={1.5}
          depthWrite={true}
        />
      </mesh>
      {/* Stars/Sparkles trapped inside */}
      <group scale={[radius * 0.75, radius * 0.75, radius * 0.75]}>
        <Sparkles
          count={12}
          scale={1}
          size={4}
          speed={0.1}
          opacity={0.8}
          color="#ffffff"
        />
        <Sparkles
          count={16}
          scale={1}
          size={6}
          speed={0.2}
          opacity={1}
          color="#ffd700" // Gold flecks
        />
      </group>
    </group>
  );
}

export function AnimatedMarbleBallMesh() {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Gentle floating rotation
      meshRef.current.rotation.y += delta * 0.2;
      // Bobbing motion
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.05;
    }
  });

  return (
    <group ref={meshRef}>
      <MarbleBallMesh />
    </group>
  );
}

export function CardDisplay({ width = "100%", height = "300px" }) {
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
        background: "linear-gradient(135deg, #111 0%, #222 100%)", // Dark background to show off glass
      }}
    >
      <Canvas camera={{ position: [0, 0, 2], fov: 50 }} shadows dpr={[1, 2]}>
        <ambientLight intensity={0.4} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          intensity={1}
          castShadow
        />
        <pointLight
          position={[-10, -10, -10]}
          intensity={0.5}
          color="#4400ff"
        />
        <pointLight
          position={[5, 5, 5]}
          intensity={0.8}
          color="#ffffff"
        />

        <AnimatedMarbleBallMesh />

        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
      </Canvas>
    </div>
  );
}

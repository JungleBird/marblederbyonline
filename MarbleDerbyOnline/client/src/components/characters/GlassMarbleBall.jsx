import React, { useRef, forwardRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

const MARBLE_CONFIG = {
  radius: 0.6,
  segments: 64,
};

// Export GlassMarbleBallMesh for reuse in other components
export const GlassMarbleBallMesh = ({ radius = MARBLE_CONFIG.radius, ...props }) => {
  return (
    <group {...props}>
      {/* Outer Glass Shell with high refractive index */}
      <mesh castShadow receiveShadow renderOrder={2}>
        <sphereGeometry args={[radius, MARBLE_CONFIG.segments, MARBLE_CONFIG.segments]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={1.0} // Fully transparent glass
          opacity={1}
          roughness={0.02} // Extremely smooth glass
          thickness={2.5} // Thick glass for strong refraction
          ior={2.4} // Very high refractive index (crown glass/crystal)
          clearcoat={1.0}
          clearcoatRoughness={0.0}
          envMapIntensity={1.8}
          depthWrite={false}
          transparent={true}
        />
      </mesh>

      {/* Inner swirl patterns - typical of glass marbles */}
      <group renderOrder={1}>
        {/* Central colorful swirl */}
        <mesh position={[0, 0, 0]}>
          <torusGeometry args={[radius * 0.3, radius * 0.08, 8, 16]} />
          <meshStandardMaterial 
            color="#4169E1" 
            transparent 
            opacity={0.7}
            emissive="#4169E1"
            emissiveIntensity={0.2}
          />
        </mesh>
        
        {/* Secondary swirl pattern */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius * 0.25, radius * 0.05, 6, 12]} />
          <meshStandardMaterial 
            color="#FF6347" 
            transparent 
            opacity={0.6}
            emissive="#FF6347"
            emissiveIntensity={0.15}
          />
        </mesh>
        
        {/* Tertiary swirl */}
        <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, Math.PI / 2]}>
          <torusGeometry args={[radius * 0.2, radius * 0.03, 6, 12]} />
          <meshStandardMaterial 
            color="#32CD32" 
            transparent 
            opacity={0.5}
            emissive="#32CD32"
            emissiveIntensity={0.1}
          />
        </mesh>
      </group>
      
      {/* Subtle inner glow */}
      <pointLight 
        position={[0, 0, 0]} 
        intensity={0.2} 
        distance={radius * 2} 
        color="#ffffff"
      />
    </group>
  );
};

export function AnimatedGlassMarbleBallMesh() {
  const meshRef = useRef();
  const innerPatternRef = useRef();

  // Gentle floating animation and swirl rotation
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
    }
    if (innerPatternRef.current) {
      innerPatternRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      innerPatternRef.current.rotation.x = state.clock.elapsedTime * 0.2;
    }
  });

  return <GlassMarbleBallMesh ref={meshRef} innerPatternRef={innerPatternRef} />;
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
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 2], fov: 50 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <pointLight position={[-5, -5, -5]} intensity={0.3} color="#87CEEB" />
        <spotLight 
          position={[2, 3, 2]} 
          angle={0.3} 
          penumbra={1} 
          intensity={0.6}
          color="#ffffff"
        />
        
        <AnimatedGlassMarbleMesh />
        
        <Environment preset="studio" />
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          autoRotate
          autoRotateSpeed={1}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
}


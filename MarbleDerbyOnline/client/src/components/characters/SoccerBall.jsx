import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { SoccerBallModel } from "../../assets/soccer-ball/SoccerBallModel";

const BALL_CONFIG = {
  radius: 0.6,
  segments: 32,
};

// Export SoccerBallMesh for reuse in other components
export const SoccerBallMesh = ({ radius = BALL_CONFIG.radius, ...props }) => {
  return (
      <SoccerBallModel radius={radius} {...props} />
  );
};

export function AnimatedSoccerBallMesh() {
  const meshRef = useRef();
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.6;
      meshRef.current.rotation.y += delta * 0.4;
    }
  });

  return <SoccerBallMesh ref={meshRef} />;
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
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        style={{ background: "transparent" }}
        shadows
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#ffffff" />
        <AnimatedSoccerBallMesh />
        <Environment preset="city" />
        <OrbitControls />
      </Canvas>
    </div>
  );
}


export default SoccerBallMesh;

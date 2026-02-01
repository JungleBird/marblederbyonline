import React, { useRef, forwardRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Edges } from "@react-three/drei";

const BALL_CONFIG = {
  radius: 0.6,
  segments: 32,
};

// Export BallMesh for reuse in other components
export const BallMesh = ({radius=BALL_CONFIG.radius, props}) => {
  return (
    <group {...props}>
      {/* Red hemisphere (top half) */}
      <mesh castShadow receiveShadow>
        <sphereGeometry
          args={[
            radius || BALL_CONFIG.radius,   // radius
            BALL_CONFIG.segments, // widthSegments
            BALL_CONFIG.segments, // heightSegments
            0,                    // phiStart (0 degrees)
            Math.PI * 2,         // phiLength (full 360 degrees around)
            0,                    // thetaStart (0 degrees from top)
            Math.PI / 2,         // thetaLength (90 degrees - top hemisphere)
          ]}
        />
        <meshStandardMaterial
          color="#ff3333"        // Red
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Blue hemisphere (bottom half) */}
      <mesh castShadow receiveShadow>
        <sphereGeometry
          args={[
            radius || BALL_CONFIG.radius,   // radius (same as top)
            BALL_CONFIG.segments, // widthSegments
            BALL_CONFIG.segments, // heightSegments
            0,                    // phiStart (0 degrees)
            Math.PI * 2,         // phiLength (full 360 degrees around)
            Math.PI / 2,         // thetaStart (90 degrees - start from equator)
            Math.PI / 2,         // thetaLength (90 degrees - bottom hemisphere)
          ]}
        />
        <meshStandardMaterial
          color="#ffff00"        // Yellow
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
};

export function AnimatedBallMesh() {
  const meshRef = useRef();
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.6;
      meshRef.current.rotation.y += delta * 0.4;
    }
  });

  return <BallMesh ref={meshRef} />;
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
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#FFA726" />
        <AnimatedBallMesh />
        <Environment preset="sunset" />
        <OrbitControls />
      </Canvas>
    </div>
  );
}

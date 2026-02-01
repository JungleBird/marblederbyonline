import React, { useMemo } from "react";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Line, Text, Edges } from "@react-three/drei";
import * as THREE from "three";
import { Door, DoorFrame, AnimatedDoor } from "../parts/Door";
import { FaceYourFearsText } from "../events/FaceYourFearsText";
import { BlahajSharkController } from "../controllers/BlahajSharkController";

// Helper axes and labels to visualize X/Y/Z directions
function AxesWithLabels() {
  return (
    // Position at corner of 20x20 plane at y=-2
    <group position={[-10, -1, -10]}>
      {/* X axis (red) */}
      <Line
        points={[
          [0, 0, 0],
          [3, 0, 0],
        ]}
        color="#ff4d4d"
        lineWidth={2}
      />
      {/* Z axis (blue) */}
      <Line
        points={[
          [0, 0, 0],
          [0, 0, 3],
        ]}
        color="#4d88ff"
        lineWidth={2}
      />
      {/* Y axis (green) */}
      <Line
        points={[
          [0, 0, 0],
          [0, 3, 0],
        ]}
        color="#28d694"
        lineWidth={2}
      />

      {/* Labels close to axes origin */}
      <Text
        position={[3.5, 0.15, 0]}
        fontSize={0.25}
        color="#ff4d4d"
        anchorX="center"
        anchorY="middle"
      >
        X
      </Text>
      <Text
        position={[0, 3.5, 0]}
        fontSize={0.25}
        color="#28d694"
        anchorX="center"
        anchorY="middle"
      >
        Y
      </Text>
      <Text
        position={[0, 0.15, 3.5]}
        fontSize={0.25}
        color="#4d88ff"
        anchorX="center"
        anchorY="middle"
      >
        Z
      </Text>
    </group>
  );
}

// Reusable MainPlatform component
function MainPlatform({ showBorders, dim, pos }) {
  const colliderDim = dim ? [dim[0] / 2, dim[1] / 2, dim[2] / 2] : [2, 2, 2];

  return (
    <>
      {/* Main Platform Collider */}
      <CuboidCollider args={colliderDim} position={pos} />
      {/* Main Platform Visual */}
      <mesh position={pos} receiveShadow>
        <boxGeometry args={dim} />
        <meshStandardMaterial color="#1a1a2e" />
        {showBorders && <Edges color="yellow" />}
      </mesh>
    </>
  );
}


function CheckerboardFloor({ showBorders, dim, pos }) {
  const colliderDim = dim ? [dim[0] / 2, dim[1] / 2, dim[2] / 2] : [2, 2, 2];

  // Create checkerboard texture
  const checkerboardTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    const squareSize = 128; // 4x4 checkerboard
    const color1 = '#2a2a3e';
    const color2 = '#1a1a2e';
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        ctx.fillStyle = (i + j) % 2 === 0 ? color1 : color2;
        ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    
    return texture;
  }, [dim]);

  // Create materials array - checkerboard on top, solid color on sides
  const materials = useMemo(() => [
    new THREE.MeshStandardMaterial({ color: '#1a1a2e' }), // right
    new THREE.MeshStandardMaterial({ color: '#1a1a2e' }), // left
    new THREE.MeshStandardMaterial({ map: checkerboardTexture }), // top
    new THREE.MeshStandardMaterial({ color: '#1a1a2e' }), // bottom
    new THREE.MeshStandardMaterial({ color: '#1a1a2e' }), // front
    new THREE.MeshStandardMaterial({ color: '#1a1a2e' }), // back
  ], [checkerboardTexture]);

  return (
    <>
      {/* Main Platform Collider */}
      <CuboidCollider args={colliderDim} position={pos} />
      {/* Main Platform Visual */}
      <mesh position={pos} receiveShadow material={materials}>
        <boxGeometry args={[dim[0], dim[1], dim[2]]} />
        {showBorders && <Edges color="yellow" />}
      </mesh>
    </>
  );
}


function Walkway({ showBorders, dim, pos}) {
  const colliderDim = dim ? [dim[0] / 2, dim[1] / 2, dim[2] / 2] : [2, 2, 2];
  return (
    <>
      {/* Walkway Collider */}
      <CuboidCollider args={colliderDim} position={pos} />
      {/* Walkway Visual */}
      <mesh position={pos} receiveShadow>
        <boxGeometry args={dim} />
        <meshStandardMaterial color="#303050" />
        {showBorders && <Edges color="yellow" />}
      </mesh>
    </>
  );
}




export default function SimpleGround({ showBorders = false }) {
  const textSequence = [
    { text: "Face Your Fears", triggerType: "zone", trigger: "D" },
    { text: "Press Space Bar to Open Door", triggerType: "zone", trigger: "D" },
  ];

  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <MainPlatform
          showBorders={showBorders}
          dim={[20, 1, 20]}
          pos={[0, -1.5, 0]}
        />
        <Walkway
          showBorders={showBorders}
          dim={[6, 1, 40]}
          pos={[0, -1.5, -30]}
        />
        {/* Door Frame (Static) */}
        
        <DoorFrame position={[0, -1, -49.8]} />
        
        {/* Checkerboard Floor at end of walkway */}
        <CheckerboardFloor
          showBorders={showBorders}
          dim={[10, 1, 10]}
          pos={[0, -1.5, -55]}
        />

        <AxesWithLabels />
      </RigidBody>

      {/* Animated Door with its own Physics */}
      <AnimatedDoor
        position={[0, -1, -49.8]}
        triggerState={{ keyPress: "spacebar" }}
        requiredZone="D"
      />

      {/* Shark Model */}
      <BlahajSharkController
        position={[1.5, -1, -60]}
        scale={3}
        rotation={[Math.PI / 6, Math.PI / 2 + 0.2, 0]}
      />

      {/* Floating Text */}
      <FaceYourFearsText />
    </>
  );
}

//TODO :write documentation on how the [AnimatedObject]'s triggerState props work

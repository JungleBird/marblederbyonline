import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { KeyboardControls, useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";

// --- Configuration for Keyboard Controls ---
// Define the control names and their corresponding key mappings
const map = [
  { name: "forward", keys: ["ArrowUp", "w", "W"] },
  { name: "backward", keys: ["ArrowDown", "s", "S"] },
  { name: "left", keys: ["ArrowLeft", "a", "A"] },
  { name: "right", keys: ["ArrowRight", "d", "D"] },
];

/**
 * 🧱 Controllable Character Block Component
 */
function CharacterBlock({ setIsWithinBounds }) {
  const rigidBodyRef = useRef();
  const [, getKeys] = useKeyboardControls(); // Use get() for polling in loop

  const MOVEMENT_SPEED = 5;
  const rotation = new THREE.Vector3();

  useFrame(() => {
    if (!rigidBodyRef.current) return;

    // Get the current input state
    const { forward, backward, left, right } = getKeys();

    // Calculate the desired movement direction
    rotation.set(0, 0, 0);
    if (forward) rotation.z = -1;
    if (backward) rotation.z = 1;
    if (left) rotation.x = -1;
    if (right) rotation.x = 1;

    // Normalize
    if (forward || backward || left || right) {
      rotation.normalize().multiplyScalar(MOVEMENT_SPEED);
    }

    // Apply movement
    // Get current velocity to preserve Y (gravity)
    const vel = rigidBodyRef.current.linvel();
    rigidBodyRef.current.setLinvel({ x: rotation.x, y: vel.y, z: rotation.z });

    // Camera follow (Optional)
    // Access the mesh inside the RigidBody if needed, but RigidBody ref gives us the body.
    // To get world position of the mesh, we can trust the body position is synced.
    // const pos = rigidBodyRef.current.translation();
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[0, 1, 0]}
      enabledRotations={[false, false, false]}
      colliders="cuboid"
      canSleep={false}
    >
      <mesh castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={"hotpink"} />
      </mesh>
    </RigidBody>
  );
}

/**
 * 🚧 Ground Component
 */
function Ground() {
  return (
    <RigidBody
      type="fixed"
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
    >
      <mesh receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="lightgray" />
      </mesh>
    </RigidBody>
  );
}

/**
 * 🧭 Sensor Zone Component
 */
function SensorZone({ setIsWithinBounds }) {
  // State for visual feedback
  const [hovered, setHovered] = useState(false);

  return (
    <RigidBody type="fixed" position={[5, 0.5, 5]} colliders={false}>
      <CuboidCollider
        args={[2, 0.5, 2]} // Half-extents for 4x1x4 box
        sensor
        onIntersectionEnter={() => {
          setIsWithinBounds(true);
          console.log("Character entered the sensor zone!");
        }}
        onIntersectionExit={() => {
          setIsWithinBounds(false);
          console.log("Character left the sensor zone!");
        }}
      />
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        receiveShadow
      >
        <boxGeometry args={[4, 1, 4]} />
        <meshStandardMaterial
          color={hovered ? "orange" : "skyblue"}
          opacity={0.5}
          transparent
        />
      </mesh>
    </RigidBody>
  );
}

/**
 * 🌟 Main Application Component
 */
export default function SensorZoneTrigger() {
  const [isWithinBounds, setIsWithinBounds] = useState(false);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 100,
          padding: 10,
          backgroundColor: "rgba(0,0,0,0.7)",
          color: "white",
          borderRadius: 5,
          fontFamily: "sans-serif",
        }}
      >
        **Status:**{" "}
        <span
          style={{
            color: isWithinBounds ? "lightgreen" : "tomato",
            fontWeight: "bold",
          }}
        >
          {isWithinBounds ? "WITHIN BOUNDS" : "OUTSIDE BOUNDS"}
        </span>
        <br />
        Use WASD or Arrow Keys to Move.
      </div>

      {/* KeyboardControls wraps the Canvas and provides the input context */}
      <KeyboardControls map={map}>
        <Canvas shadows camera={{ position: [0, 10, 10], fov: 60 }}>
          <color attach="background" args={["#202030"]} />
          <ambientLight intensity={0.5} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.3}
            penumbra={1}
            castShadow
            intensity={2}
          />

          {/* Physics component wraps all physics bodies */}
          <Physics>
            <Ground />
            {/* Pass the state setter to the SensorZone */}
            <SensorZone setIsWithinBounds={setIsWithinBounds} />
            <CharacterBlock setIsWithinBounds={setIsWithinBounds} />
          </Physics>
        </Canvas>
      </KeyboardControls>
    </div>
  );
}

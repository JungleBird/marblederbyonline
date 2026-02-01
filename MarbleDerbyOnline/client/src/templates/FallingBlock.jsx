import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Physics,
  useBox,
  usePlane,
  useRaycastVehicle,
} from "@react-three/cannon";
import {
  KeyboardControls,
  useKeyboardControls,
  PerspectiveCamera,
} from "@react-three/drei";
import * as THREE from "three";

// --- Configuration for Keyboard Controls ---
const map = [
  { name: "forward", keys: ["ArrowUp", "w", "W"] },
  { name: "backward", keys: ["ArrowDown", "s", "S"] },
  { name: "left", keys: ["ArrowLeft", "a", "A"] },
  { name: "right", keys: ["ArrowRight", "d", "D"] },
];

// --- Hover Character Constants ---
const HOVER_HEIGHT = 1.0; // Target height above the ground
const MAX_FORCE = 50; // Force applied for movement
const HOVER_FORCE = 15; // Base force to keep it hovering
const DAMPING = 0.5; // Damping force for stability
const CHASSIS_MASS = 50; // High mass for stable physics

/**
 * 🧱 Hovering Character Block Component
 * Uses the raycast vehicle setup for simplified raycasting/suspension
 */
function HoverBlock({ position = [0, HOVER_HEIGHT + 0.5, 0] }) {
  const [subscribeKeys] = useKeyboardControls();
  const { camera } = useThree();

  // 1. Chassis Setup: A normal box with high mass
  const [chassisRef, chassisApi] = useBox(
    () => ({
      mass: CHASSIS_MASS,
      position,
      args: [1, 1, 1], // The visual size of the block
      allowSleep: false,
    }),
    useRef(null)
  );

  // 2. Raycast Vehicle Setup: Defines the raycasting points (like wheels)
  // We use the RaycastVehicle API specifically for its Raycasting and suspension logic.
  // The four "wheel" points will act as the corner sensors for hovering.
  const [vehicleRef, vehicleApi] = useRaycastVehicle(
    () => ({
      chassisBody: chassisRef,
      // Define the raycasting points in local space (corners of the block base)
      wheelInfos: [
        {
          chassisConnectionPointLocal: new THREE.Vector3(
            0.5,
            -0.5,
            0.5
          ).toArray(),
        },
        {
          chassisConnectionPointLocal: new THREE.Vector3(
            -0.5,
            -0.5,
            0.5
          ).toArray(),
        },
        {
          chassisConnectionPointLocal: new THREE.Vector3(
            0.5,
            -0.5,
            -0.5
          ).toArray(),
        },
        {
          chassisConnectionPointLocal: new THREE.Vector3(
            -0.5,
            -0.5,
            -0.5
          ).toArray(),
        },
      ].map((info) => ({
        ...info,
        is: "HoverWheel", // Custom property for debugging (optional)
        // Suspension settings are key for the hover effect
        suspensionStiffness: 100, // Makes the spring stiff
        suspensionRestLength: HOVER_HEIGHT, // Target distance from raycast hit
        maxSuspensionForce: 1000,
        maxSuspensionTravel: 1,
        // Damping settings
        suspensionDamping: 10,
        rollInfluence: 0.1,
        // Other general settings
        frictionSlip: 0,
        useBrake: false,
      })),
      // Setting up the API reference for the chassis
      indexForwardAxis: 2,
      indexRightAxis: 0,
      indexUpAxis: 1,
    }),
    useRef(null)
  );

  // State for HUD
  const [isHovering, setIsHovering] = useState(false);
  const velocity = useRef([0, 0, 0]);
  useEffect(
    () => chassisApi.velocity.subscribe((v) => (velocity.current = v)),
    [chassisApi.velocity]
  );

  // 3. Game Loop Logic: Runs every frame
  useFrame((state, delta) => {
    const { forward, backward, left, right } = subscribeKeys((s) => s);
    const rotation = new THREE.Vector3();

    // --- A. Apply Movement Forces ---
    rotation.set(0, 0, 0);
    if (forward) rotation.z = -1;
    if (backward) rotation.z = 1;
    if (left) rotation.x = -1;
    if (right) rotation.x = 1;

    // Apply force only on the XZ plane (no vertical force for movement)
    if (forward || backward || left || right) {
      rotation.normalize().multiplyScalar(MAX_FORCE);
      chassisApi.applyForce([rotation.x, 0, rotation.z], [0, 0, 0]);
    }

    // --- B. Hover/Suspension Simulation (Core Logic) ---
    let wheelsOnGround = 0;

    // The vehicle API provides raycasting results for the "wheels"
    for (let i = 0; i < 4; i++) {
      // Get the current wheel info
      const wheelInfo = vehicleApi.getWheelInfo(i);

      // Raycast successful hit
      if (wheelInfo.raycastResult.hasHit) {
        wheelsOnGround++;

        // The raycast hit point on the ground
        const { hitPointWorld, rayFromWorld } = wheelInfo.raycastResult;

        // Current distance from the chassis to the ground
        const currentDistance = hitPointWorld.distanceTo(
          new THREE.Vector3(...rayFromWorld)
        );

        // Calculate the error (how far we are from the target hover height)
        const error = HOVER_HEIGHT - currentDistance;

        // Apply a force proportional to the error (Spring Force: F = -kx)
        // A higher force pushes the block up if too low, or lessens if too high.
        // We use the Up vector (Y-axis) in world space for the force direction.
        const hoverForce = error * HOVER_FORCE;

        // Apply the force at the raycast origin (wheel)
        chassisApi.applyForce(
          [0, hoverForce, 0],
          [
            wheelInfo.chassisConnectionPointLocal[0],
            wheelInfo.chassisConnectionPointLocal[1],
            wheelInfo.chassisConnectionPointLocal[2],
          ]
        );

        // Damping: Reduce vertical velocity to prevent oscillation
        // If the block is moving up/down (Y velocity), apply an opposing force.
        const dampingForce = -velocity.current[1] * DAMPING;
        chassisApi.applyForce([0, dampingForce, 0], [0, 0, 0]);
      }
    }

    // Update HUD state
    setIsHovering(wheelsOnGround > 0);

    // --- C. Camera Follow (Drei's PerspectiveCamera) ---
    // Get the character's current position
    const chassisPosition = new THREE.Vector3();
    chassisRef.current.getWorldPosition(chassisPosition);

    // Camera target position: behind and above the character
    const cameraTarget = chassisPosition
      .clone()
      .add(new THREE.Vector3(0, 5, 5));

    // Smoothly move the camera and make it look at the block
    camera.position.lerp(cameraTarget, 0.05);
    camera.lookAt(chassisPosition.add(new THREE.Vector3(0, 0.5, 0)));
  });

  // 4. Render the visual mesh (Cube)
  return (
    // The chassis body acts as the visual mesh
    <mesh ref={chassisRef} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={isHovering ? "greenyellow" : "red"} />
    </mesh>
  );
}

/**
 * 🚧 Elevated Ground Component
 */
function ElevatedGround() {
  // Use a large, slightly elevated box instead of a plane so the character can fall off
  const [ref] = useBox(() => ({
    mass: 0,
    position: [0, -0.5, 0], // Position the top surface at Y=0
    args: [20, 1, 20],
  }));

  return (
    <mesh ref={ref} receiveShadow>
      <boxGeometry args={[20, 1, 20]} />
      <meshStandardMaterial color="darkgray" />
    </mesh>
  );
}

/**
 * 🌟 Main Application Component
 */
export default function App() {
  const [isHovering, setIsHovering] = useState(true);

  return (
    <>
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
            color: isHovering ? "lightgreen" : "tomato",
            fontWeight: "bold",
          }}
        >
          {isHovering ? "HOVERING" : "FALLING!"}
        </span>
        <br />
        Use WASD or Arrow Keys to Move.
      </div>

      <KeyboardControls map={map}>
        <Canvas shadows>
          <color attach="background" args={["#101015"]} />
          <PerspectiveCamera makeDefault position={[0, 10, 10]} fov={60} />

          <ambientLight intensity={0.3} />
          <spotLight
            position={[10, 15, 10]}
            angle={0.5}
            penumbra={1}
            castShadow
            intensity={500}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />

          <Physics>
            <ElevatedGround />
            <HoverBlock />
          </Physics>
        </Canvas>
      </KeyboardControls>
    </>
  );
}

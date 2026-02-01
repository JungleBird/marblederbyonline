import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../../stores/gameStore";
import { RigidBody } from "@react-three/rapier";
import { useKeyboardControls } from "@react-three/drei";

export function DoorFrame({ position }) {
  return (
    <group position={position}>
      {/* Frame Left Post */}
      <mesh position={[-2.75, 3.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 7.2, 0.4]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Frame Right Post */}
      <mesh position={[2.75, 3.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 7.2, 0.4]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Frame Top Header */}
      <mesh position={[0, 6.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 0.6, 0.4]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
    </group>
  );
}

export function Door({ position }) {
  return (
    <group position={position}>
      {/* Door Panel (Split into parts for window) */}
      {/* Bottom Section */}
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 4, 0.2]} />
        <meshStandardMaterial color="#1a120b" />
      </mesh>
      {/* Top Section */}
      <mesh position={[0, 6.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 0.6, 0.2]} />
        <meshStandardMaterial color="#1a120b" />
      </mesh>
      {/* Left Section */}
      <mesh position={[-1.875, 5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.25, 2, 0.2]} />
        <meshStandardMaterial color="#1a120b" />
      </mesh>
      {/* Right Section */}
      <mesh position={[1.875, 5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.25, 2, 0.2]} />
        <meshStandardMaterial color="#1a120b" />
      </mesh>

      {/* Window Glass */}
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[2.5, 2, 0.05]} />
        <meshStandardMaterial color="#000000ff" transparent opacity={0} />
      </mesh>

      {/* Window Frame (Perimeter + Cross) */}
      {/* Cross Vertical */}
      <mesh position={[0, 5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 2, 0.2]} />
        <meshStandardMaterial color="#0b0805" />
      </mesh>
      {/* Cross Horizontal */}
      <mesh position={[0, 5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.15, 0.2]} />
        <meshStandardMaterial color="#0b0805" />
      </mesh>
      {/* Perimeter Top */}
      <mesh position={[0, 5.925, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.1, 0.4]} />
        <meshStandardMaterial color="#0b0805" />
      </mesh>
      {/* Perimeter Bottom */}
      <mesh position={[0, 4.075, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.1, 0.4]} />
        <meshStandardMaterial color="#0b0805" />
      </mesh>
      {/* Perimeter Left */}
      <mesh position={[-1.175, 5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 2, 0.4]} />
        <meshStandardMaterial color="#0b0805" />
      </mesh>
      {/* Perimeter Right */}
      <mesh position={[1.175, 5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 2, 0.4]} />
        <meshStandardMaterial color="#0b0805" />
      </mesh>
      {/* Door Knob */}
      <mesh position={[2, 3.3, 0.2]} castShadow>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Door Hinges */}
      <mesh position={[-2.5, 1.5, 0.15]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 0.4, 0.1]} />
        <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-2.5, 5.5, 0.15]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 0.4, 0.1]} />
        <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

export function AnimatedDoor({ position, triggerState = {}, requiredZone = null, endState = {condition: {rotation: [0, -Math.PI/2, 0] }, orientation: [0, -Math.PI/2, 0]} }) {
  const rbRef = useRef();
  const isLatched = useRef(false);
  const sensorStates = useGameStore((state) => state.sensorStates);
  const setEventTriggered = useGameStore((state) => state.setEventTriggered);
  const setProgressState = useGameStore((state) => state.setProgressState);

  useEffect(() => {
    setProgressState("DoorLatchedProgress", 0);
  }, []);
  
  // triggerState is expected to be { type: "id" } e.g. { zone: "D" }
  const triggerType = Object.keys(triggerState)[0];
  const triggerId = Object.values(triggerState)[0];

  const isKeyPressed = useKeyboardControls((state) => {
    return triggerType === "keyPress" ? !!state[triggerId] : false;
  });

  let isOpen = false;
  if (triggerType === "zone") {
    isOpen = !!sensorStates[triggerId];
  } else if (triggerType === "keyPress") {
    isOpen = isKeyPressed;
  }

  // If a required zone is specified, the door only opens if the sensor for that zone is active
  if (requiredZone && !sensorStates[requiredZone]) {
    isOpen = false;
  }
  
  // Hinge is at x = -2.5 relative to door center.
  // We place the RigidBody at the hinge location.
  const hingePos = [position[0] - 2.5, position[1], position[2]];

  useFrame((state, delta) => {
    if (rbRef.current) {
      if (isLatched.current) {
        const [x, y, z] = endState.orientation;
        const nextQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
        rbRef.current.setNextKinematicRotation(nextQ);
        return;
      }

      const targetRotation = isOpen ? -Math.PI / 2 : 0;
      
      // Get current rotation (approximate from last frame or read from RB if needed, 
      // but for simple lerp we can just track it or read the object's rotation)
      // Since setNextKinematicRotation sets the *next* frame, we should maintain state.
      // However, reading rbRef.current.rotation() gives the quaternion.
      
      const q = rbRef.current.rotation();
      const currentQ = new THREE.Quaternion(q.x, q.y, q.z, q.w);
      const currentEuler = new THREE.Euler().setFromQuaternion(currentQ);
      
      // Lerp the Y rotation
      const newY = THREE.MathUtils.lerp(currentEuler.y, targetRotation, delta * 2);

      // Update progress state (0 to 90 degrees)
      // newY goes from 0 to -PI/2 (-1.57). We want 0 to 90.
      const degrees = Math.abs(THREE.MathUtils.radToDeg(newY));
      setProgressState("DoorLatchedProgress", Math.min(degrees, 90));

      // Check if we reached the end state condition
      if (isOpen && Math.abs(newY) >= Math.abs(endState.condition.rotation[1]) - 0.01) {
        if (!isLatched.current) {
          isLatched.current = true;
          setEventTriggered("FrontDoorLatched");
          setProgressState("DoorLatchedProgress", 90);
        }
      }
      
      const nextQ = new THREE.Quaternion();
      nextQ.setFromEuler(new THREE.Euler(0, newY, 0));
      
      rbRef.current.setNextKinematicRotation(nextQ);
    }
  });

  return (
    <RigidBody 
      ref={rbRef} 
      type="kinematicPosition" 
      position={hingePos} 
      colliders="hull"
    >
      {/* Shift door mesh so its hinge aligns with RB origin (0,0,0) */}
      <group position={[2.5, 0, 0]}>
        <Door position={[0, 0, 0]} />
      </group>
    </RigidBody>
  );
}

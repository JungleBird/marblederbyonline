import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect } from "react";
import { useKeyboardControls } from "@react-three/drei";
import { useGameStore } from "../stores/gameStore";
import { useResetToStartingPoint } from "./UniversalController";

export const useBallController = (characterRef, speed = 0.5, mass = 1) => {
  const [, get] = useKeyboardControls();
  const initialPosition = useGameStore((state) => state.initialPosition);
  const initialRotation = useGameStore((state) => state.initialRotation);

  const resetPosition = useResetToStartingPoint({
    characterRef,
    initialPosition,
    initialRotation,
  });

  // Reusable vectors
  const moveDirection = new THREE.Vector3();
  const upVector = new THREE.Vector3(0, 1, 0);
  const torque = new THREE.Vector3();

  useEffect(() => {
    if (characterRef.current) {
      characterRef.current.setGravityScale(mass, true);
    }
  }, [mass, characterRef]);

  useFrame(() => {
    if (!characterRef.current) return;

    const { forward, backward, left, right, reset } = get();

    // Reset position if 'r' is pressed
    if (reset) {
      resetPosition();
      return;
    }

    const isMoving = forward || backward || left || right;

    if (isMoving) {
      // Calculate movement vector (World Space)
      moveDirection.set(0, 0, 0);

      if (forward) moveDirection.z -= 1;
      if (backward) moveDirection.z += 1;
      if (left) moveDirection.x -= 1;
      if (right) moveDirection.x += 1;

      moveDirection.normalize().multiplyScalar(speed);

      // Apply impulse for movement
      characterRef.current.applyImpulse(moveDirection, true);

      torque.crossVectors(moveDirection, upVector).multiplyScalar(-1);
      characterRef.current.applyTorqueImpulse(torque, true);
    } else {
      // Apply damping when not moving
      const linvel = characterRef.current.linvel();
      const angvel = characterRef.current.angvel();

      characterRef.current.setLinvel(
        { x: linvel.x * 0.98, y: linvel.y, z: linvel.z * 0.98 },
        true
      );
      characterRef.current.setAngvel(
        { x: angvel.x * 0.95, y: angvel.y * 0.95, z: angvel.z * 0.95 },
        true
      );
    }
  });
};
